import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createPickupToken, hashPickupToken } from "../../../../modules/pickup-verification/token"
import { orderById, pickupService, publicOrder, requiresAgeVerification } from "../../../pickup-verification-helpers"

type Body = { order_id?: string; email?: string }

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const orderId = String(req.body?.order_id || "")
  const email = String(req.body?.email || "").trim().toLowerCase()
  if (!orderId || !email) return void res.status(400).json({ message: "Order and email are required." })

  const order = await orderById(req, orderId)
  if (!order || String(order.email || "").toLowerCase() !== email) {
    return void res.status(404).json({ message: "Pickup order not found." })
  }

  const service = pickupService(req)
  const [existing] = await service.listPickupVerifications({ order_id: orderId }, { take: 1 })
  if (existing?.status === "completed") {
    return void res.status(410).json({ message: "Pickup already completed.", ...publicOrder(order, existing) })
  }
  if (["cancelled", "canceled"].includes(String(order.status)) || String(order.metadata?.pickup_status) === "cancelled") {
    return void res.status(409).json({ message: "This pickup was canceled." })
  }

  const token = createPickupToken()
  const expiresAt = new Date(Date.now() + Number(process.env.PICKUP_QR_TTL_DAYS || 30) * 86_400_000)
  const verification = existing
    ? await service.updatePickupVerifications({
        id: existing.id,
        token_hash: hashPickupToken(token),
        token_expires_at: expiresAt,
        status: "active",
        requires_age_verification: requiresAgeVerification(order),
      })
    : await service.createPickupVerifications({
        order_id: orderId,
        token_hash: hashPickupToken(token),
        token_expires_at: expiresAt,
        requires_age_verification: requiresAgeVerification(order),
      })

  res.json({ token, expiresAt, ...publicOrder(order, verification) })
}
