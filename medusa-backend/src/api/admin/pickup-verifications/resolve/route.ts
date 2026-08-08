import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createPickupToken, hashPickupToken } from "../../../../modules/pickup-verification/token"
import { audit, orderByDisplayId, orderById, pickupService, publicOrder, requiresAgeVerification } from "../../../pickup-verification-helpers"

type Body = { token?: string; order_number?: string }

export async function POST(req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse) {
  const service = pickupService(req)
  const employeeId = req.auth_context?.actor_id
  let verification: any
  let order: any

  if (req.body?.token) {
    const [matched] = await service.listPickupVerifications({ token_hash: hashPickupToken(String(req.body.token)) }, { take: 1 })
    if (!matched) return void res.status(404).json({ message: "Invalid pickup QR code." })
    verification = matched
    order = await orderById(req, matched.order_id)
    await audit(service, matched, "pickup_qr_scanned", employeeId, { result: matched.status })
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
    return void res.status(400).json({ message: "Scan a pickup QR or enter an order number." })
  }

  if (!order) return void res.status(404).json({ message: "Pickup order not found." })
  if (verification.status === "completed") {
    return void res.status(410).json({ message: "Pickup already completed.", ...publicOrder(order, verification) })
  }
  if (verification.status !== "active") return void res.status(410).json({ message: `Pickup pass is ${verification.status}.` })
  if (verification.token_expires_at && new Date(verification.token_expires_at) < new Date()) {
    await service.updatePickupVerifications({ id: verification.id, status: "expired" })
    return void res.status(410).json({ message: "Pickup QR code has expired." })
  }
  if (["cancelled", "canceled"].includes(String(order.status)) || String(order.metadata?.pickup_status) === "cancelled") {
    return void res.status(409).json({ message: "This order was canceled." })
  }
  if (!["ready", "arrived"].includes(String(order.metadata?.pickup_status))) {
    return void res.status(409).json({ message: "This order is not ready for pickup." })
  }

  await audit(service, verification, "order_opened_for_verification", employeeId)
  res.json(publicOrder(order, verification))
}
