import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOrderFulfillmentWorkflow, markOrderFulfillmentAsDeliveredWorkflow } from "@medusajs/medusa/core-flows"
import { fulfillmentItemsForOrder } from "../api/pickup-verification-helpers"

/**
 * Runnable remediation for the confirmed defect where `pickupCompletionPlan`
 * treated any pre-existing active fulfillment as full coverage: an order can
 * reach `status='completed'` while a line item stays at
 * `fulfilled_quantity < quantity`, permanently stranding the inventory
 * reservation behind it (see `scan-stranded-pickup-completions.ts` for a
 * read-only report of which orders are affected).
 *
 * For each affected order this drives the exact same workflows the fixed
 * completion route uses for its own remainder-coverage case: create a
 * fulfillment for the still-unfulfilled quantity, then mark it delivered.
 * That fulfillment creation is what releases the stranded reservation — it
 * is not touched directly. Only `status='completed'` orders are considered,
 * and only the specific items still short of full coverage are included in
 * the created fulfillment, so already-covered items are left untouched.
 *
 * Idempotent / safe to re-run: an order with nothing left to cover is
 * skipped (`fulfillmentItemsForOrder` returns nothing to fulfill).
 *
 * Run with: npx medusa exec ./src/migration-scripts/remediate-stranded-pickup-completions.ts
 */
export default async function remediateStrandedPickupCompletions({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "status", "version", "items.id", "items.quantity", "items.detail.id", "items.detail.quantity", "items.detail.fulfilled_quantity"],
    filters: { status: "completed" },
  })

  let remediated = 0
  for (const order of orders as any[]) {
    const fulfillmentItems = fulfillmentItemsForOrder(order)
    if (!fulfillmentItems.length) continue

    logger.info(`[remediate-stranded-pickup-completions] Order ${order.display_id} (${order.id}) is short ${fulfillmentItems.length} item(s); creating a fulfillment for the remainder.`)
    const { result: fulfillment } = await createOrderFulfillmentWorkflow(container).run({
      input: { order_id: order.id, items: fulfillmentItems, no_notification: true },
    })
    await markOrderFulfillmentAsDeliveredWorkflow(container).run({
      input: { orderId: order.id, fulfillmentId: fulfillment.id, no_notification: true },
    })
    logger.info(`[remediate-stranded-pickup-completions] Order ${order.display_id} remediated: fulfillment ${fulfillment.id} created and delivered.`)
    remediated += 1
  }

  if (!remediated) {
    logger.info("[remediate-stranded-pickup-completions] No completed orders with unfulfilled items found. Nothing to do.")
    return
  }
  logger.info(`[remediate-stranded-pickup-completions] Remediated ${remediated} order(s).`)
}
