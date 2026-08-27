import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { completeOrderWorkflow, markOrderFulfillmentAsDeliveredWorkflow } from "@medusajs/medusa/core-flows"

/**
 * One-off remediation for orders completed by the pre-fix pickup-completion
 * route: it flipped `metadata.pickup_status` to "completed" without ever
 * driving the fulfillment to `delivered_at` or the order to `status:
 * "completed"`. This script finds that drift and closes it out using the
 * same core workflows the (now fixed) completion route uses, so it does not
 * hand-write Medusa's internal state.
 *
 * Idempotent / safe to re-run: orders already consistent are skipped, and
 * every mutation goes through the same validated workflows an employee
 * action would trigger.
 */
export default async function remediateStuckPickupCompletions({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderService = container.resolve(Modules.ORDER)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "status", "metadata", "fulfillments.id", "fulfillments.canceled_at", "fulfillments.delivered_at"],
    filters: {},
  })

  const drifted = orders.filter((order: any) => order.metadata?.pickup_status === "completed" && order.status !== "completed")

  if (!drifted.length) {
    logger.info("[remediate-stuck-pickup-completions] No drifted orders found.")
    return
  }

  for (const order of drifted) {
    logger.info(`[remediate-stuck-pickup-completions] Fixing order ${order.display_id} (${order.id})`)
    const activeFulfillment = (order.fulfillments || []).find((f: any) => !f.canceled_at)
    if (!activeFulfillment) {
      logger.warn(`[remediate-stuck-pickup-completions] Order ${order.display_id} has pickup_status=completed but no fulfillment exists — skipping, needs manual review.`)
      continue
    }
    if (!activeFulfillment.delivered_at) {
      await markOrderFulfillmentAsDeliveredWorkflow(container).run({
        input: { orderId: order.id, fulfillmentId: activeFulfillment.id, no_notification: true },
      })
    }
    await completeOrderWorkflow(container).run({
      input: { orderIds: [order.id] },
    })
    logger.info(`[remediate-stuck-pickup-completions] Order ${order.display_id} is now status=completed.`)
  }
}
