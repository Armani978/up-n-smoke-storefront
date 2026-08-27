import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ILockingModule } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { completeOrderWorkflow, createOrderFulfillmentWorkflow, markOrderFulfillmentAsDeliveredWorkflow, updateOrderWorkflow } from "@medusajs/medusa/core-flows"
import { createPickupToken, hashPickupToken } from "../../../../../modules/pickup-verification/token"
import { audit, canAttemptPickupCompletion, fulfillmentItemsForOrder, orderById, pickupCompletionPlan, pickupService, pickupStatus, publicOrder } from "../../../../pickup-verification-helpers"

type Body = {
  checklist?: {
    customer_match?: boolean
    physical_id_presented?: boolean
    id_valid_not_expired?: boolean
    age_confirmed?: boolean
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>
    if (typeof record.message === "string") return record.message
    try { return JSON.stringify(error) } catch { return String(error) }
  }
  return String(error)
}

export async function POST(req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse) {
  const locking = req.scope.resolve(Modules.LOCKING) as ILockingModule
  try {
    const result = await locking.execute(`pickup-verification:${req.params.id}`, async () => {
      const service = pickupService(req)
      const [verification] = await service.listPickupVerifications({ id: req.params.id }, { take: 1 })
      if (!verification) throw Object.assign(new Error("Pickup verification not found."), { status: 404 })
      const order = await orderById(req, verification.order_id)
      if (!order) throw Object.assign(new Error("Pickup order not found."), { status: 404 })
      if (verification.status === "completed") return { alreadyCompleted: true, ...publicOrder(order, verification) }
      if (!canAttemptPickupCompletion(verification.status)) throw Object.assign(new Error("Pickup verification is no longer active."), { status: 409 })
      if (["cancelled", "canceled"].includes(String(order.status)) || pickupStatus(order) === "cancelled") {
        throw Object.assign(new Error("Canceled orders cannot be completed."), { status: 409 })
      }
      if (!["ready", "arrived"].includes(pickupStatus(order))) {
        throw Object.assign(new Error("Only ready orders can be completed."), { status: 409 })
      }
      const checklist = req.body?.checklist || {}
      const missingStandardCheck = !checklist.customer_match
      const missingAgeCheck = verification.requires_age_verification && (!checklist.physical_id_presented || !checklist.id_valid_not_expired || !checklist.age_confirmed)
      if (missingStandardCheck || missingAgeCheck) {
        throw Object.assign(new Error("Complete every required ID checklist item."), { status: 400 })
      }
      if (verification.requires_age_verification && verification.age_verified !== true) {
        throw Object.assign(new Error("A passing server-side age verification is required."), { status: 409 })
      }

      await service.updatePickupVerifications({ id: verification.id, status: "processing" })

      try {
        const plan = pickupCompletionPlan(order)
        const fulfillmentIdsToDeliver = [...plan.undeliveredFulfillmentIds]
        if (plan.needsFulfillmentCreation) {
          const fulfillmentItems = fulfillmentItemsForOrder(order)
          const { result: fulfillment } = await createOrderFulfillmentWorkflow(req.scope).run({
            input: {
              order_id: order.id,
              items: fulfillmentItems,
              no_notification: false,
            },
          })
          fulfillmentIdsToDeliver.push(fulfillment.id)
        }
        for (const fulfillmentId of fulfillmentIdsToDeliver) {
          await markOrderFulfillmentAsDeliveredWorkflow(req.scope).run({
            input: {
              orderId: order.id,
              fulfillmentId,
              no_notification: false,
            },
          })
        }
        if (plan.needsOrderCompletion) {
          await completeOrderWorkflow(req.scope).run({
            input: { orderIds: [order.id] },
          })
        }
        const actorId = req.auth_context?.actor_id || "employee"
        const latestOrder = await orderById(req, order.id)
        const completedMetadata = {
          ...(latestOrder?.metadata || order.metadata || {}),
          pickup_status: "completed",
          pickup_completed_at: new Date().toISOString(),
          pickup_completed_by: actorId,
        }
        await updateOrderWorkflow(req.scope).run({
          input: { id: order.id, user_id: actorId, metadata: completedMetadata },
        })
        const completed = await service.updatePickupVerifications({
          id: verification.id,
          status: "completed",
          completed_at: new Date(),
          completed_by: actorId,
          token_hash: hashPickupToken(createPickupToken()),
          token_expires_at: new Date(),
        })
        await audit(service, verification, "pickup_completed", req.auth_context?.actor_id, {
          verification_method: verification.verification_method,
          result: "completed",
          metadata: { checklist_complete: true },
        })
        return publicOrder({ ...order, metadata: completedMetadata }, completed)
      } catch (error) {
        await service.updatePickupVerifications({ id: verification.id, status: "active" })
        console.error("[pickup-complete] fulfillment failed", {
          verificationId: verification.id,
          orderId: order.id,
          error: errorMessage(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw error
      }
    }, { timeout: 10 })
    res.json(result)
  } catch (error) {
    console.error("[pickup-complete] request failed", {
      verificationId: req.params.id,
      error: errorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    const status = Number((error as { status?: number }).status || 500)
    res.status(status).json({ message: errorMessage(error) || "Unable to complete pickup." })
  }
}
