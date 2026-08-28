import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createPickupToken, hashPickupToken } from "../../../../modules/pickup-verification/token"
import { audit, orderByDisplayId, orderById, pickupService, pickupStatus, publicOrder, requiresAgeVerification } from "../../../pickup-verification-helpers"

type Body = { token?: string; order_number?: string }

export async function POST(req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse) {
  const service = pickupService(req)
  const employeeId = req.auth_context?.actor_id
  let verification: any
  let order: any

  if (req.body?.token) {
    const [matched] = await service.listPickupVerifications({ token_hash: hashPickupToken(String(req.body.token)) }, { take: 1 })
    if (!matched) return void res.status(404).json({ message: "Invalid pickup code." })
    verification = matched
    order = await orderById(req, matched.order_id)
    await audit(service, matched, "pickup_qr_scanned", employeeId, { result: matched.status, method: "pickup_code" })
  } else if (req.body?.order_number) {
    order = await orderByDisplayId(req, String(req.body.order_number))
    if (!order) return void res.status(404).json({ message: "Pickup order not found." })
    ;[verification] = await service.listPickupVerifications({ order_id: order.id }, { take: 1 })
    if (!verification) {
      verification = await service.createPickupVerifications({
        order_id: order.id,
        token_hash: hashPickupToken(createPickupToken()),
        requires_age_verification: requiresAgeVerification(order),
      })
    }
  } else {
    return void res.status(400).json({ message: "Enter a pickup code or order number." })
  }

  if (!order) return void res.status(404).json({ message: "Pickup order not found." })
  if (verification.status === "completed") {
    return void res.status(410).json({ message: "Pickup already completed.", ...publicOrder(order, verification) })
  }
  if (!["active", "processing"].includes(verification.status)) return void res.status(410).json({ message: `Pickup pass is ${verification.status}.` })
  if (verification.token_expires_at && new Date(verification.token_expires_at) < new Date()) {
    await service.updatePickupVerifications({ id: verification.id, status: "expired" })
    return void res.status(410).json({ message: "Pickup code has expired." })
  }
  if (["cancelled", "canceled"].includes(String(order.status)) || pickupStatus(order) === "cancelled") {
    return void res.status(409).json({ message: "This order was canceled." })
  }
  if (!["ready", "arrived"].includes(pickupStatus(order))) {
    if (pickupStatus(order) === "completed") {
      // Order metadata says completed but this verification (the compliance
      // record) never got finalized -- a crash in /complete between the
      // order-metadata write and verification finalization. verification.status
      // is guaranteed active/processing at this point (checked above, "completed"
      // already returned 410), so letting the employee back in here can't
      // reopen a genuinely-finished handoff; it lets /complete's own retry
      // logic repair the stranded compliance record instead of leaving it
      // permanently unreachable through the normal scan/resolve flow.
    } else if (["pending", "accepted", "preparing"].includes(pickupStatus(order))) {
      const orderService = req.scope.resolve(Modules.ORDER) as IOrderModuleService
      const metadata = { ...(order.metadata || {}), pickup_status: "arrived" }
      await orderService.updateOrders([{ id: order.id, metadata }])
      order = { ...order, metadata }
    } else {
      return void res.status(409).json({ message: "This order cannot be opened for pickup." })
    }
  }

  await audit(service, verification, "order_opened_for_verification", employeeId)
  res.json(publicOrder(order, verification))
}
