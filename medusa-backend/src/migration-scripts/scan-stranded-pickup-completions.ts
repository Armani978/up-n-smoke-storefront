import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Read-only scan for the confirmed defect where `pickupCompletionPlan`
 * treated any pre-existing active fulfillment as full coverage: an order
 * can reach `status='completed'` while a line item is still at
 * `fulfilled_quantity < quantity`, and the reservation behind that item is
 * never released. This script only reports affected orders — it makes no
 * writes. Remediating a reported order means driving it through the same
 * completion route logic (create a fulfillment for the remainder, mark it
 * delivered) via the Medusa admin API or a follow-up script; this scan does
 * not do that automatically.
 */
export default async function scanStrandedPickupCompletions({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "status", "version", "items.id", "items.quantity", "items.detail.quantity", "items.detail.fulfilled_quantity"],
    filters: { status: "completed" },
  })

  const affected = orders.filter((order: any) =>
    (order.items || []).some((item: any) => Number(item.detail?.fulfilled_quantity ?? 0) < Number(item.detail?.quantity ?? item.quantity ?? 0)),
  )

  if (!affected.length) {
    logger.info("[scan-stranded-pickup-completions] No completed orders with unfulfilled items found.")
    return
  }

  for (const order of affected) {
    const shortItems = (order.items || []).filter((item: any) => Number(item.detail?.fulfilled_quantity ?? 0) < Number(item.detail?.quantity ?? item.quantity ?? 0))
    logger.warn(`[scan-stranded-pickup-completions] Order ${order.display_id} (${order.id}) is completed with ${shortItems.length} unfulfilled item(s) — inventory reservations for those items are likely stranded. Needs manual remediation.`)
  }
  logger.warn(`[scan-stranded-pickup-completions] ${affected.length} order(s) found. This script is read-only; remediate each order manually.`)
}
