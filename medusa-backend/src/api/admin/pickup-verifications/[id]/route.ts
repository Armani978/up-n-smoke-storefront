import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { audit, orderById, pickupService, publicOrder } from "../../../pickup-verification-helpers"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const service = pickupService(req)
  const [verification] = await service.listPickupVerifications({ id: req.params.id }, { take: 1 })
  if (!verification) return void res.status(404).json({ message: "Pickup verification not found." })
  const order = await orderById(req, verification.order_id)
  if (!order) return void res.status(404).json({ message: "Pickup order not found." })
  if (verification.status === "active") await audit(service, verification, "order_opened_for_verification", req.auth_context?.actor_id)
  res.json(publicOrder(order, verification))
}
