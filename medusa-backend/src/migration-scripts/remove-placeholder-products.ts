import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { deleteProductsWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows"

const chunks = <T>(items: T[], size: number) =>
  Array.from({length: Math.ceil(items.length / size)}, (_, index) => items.slice(index * size, (index + 1) * size))

export default async function removePlaceholderProducts({container}: {container: MedusaContainer}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {data: products} = await query.graph({
    entity: "product",
    fields: ["id", "title", "thumbnail", "metadata", "variants.inventory_items.inventory_item_id"],
  })
  const {data: reservations} = await query.graph({
    entity: "reservation_item",
    fields: ["inventory_item_id"],
  })
  const reservedInventoryIds = new Set(reservations.map((reservation: any) => reservation.inventory_item_id))

  const placeholders = products.filter((product: any) => {
    const thumbnail = String(product.thumbnail ?? "")
    return product.metadata?.photo_verified !== true && !thumbnail.startsWith("/product-images/")
  })
  const retainedForOrders = placeholders.filter((product: any) =>
    product.variants?.some((variant: any) =>
      variant.inventory_items?.some((item: any) => reservedInventoryIds.has(item.inventory_item_id))))
  const deletable = placeholders.filter((product: any) => !retainedForOrders.includes(product))

  logger.info(`Catalog cleanup found ${placeholders.length} placeholder products, including ${retainedForOrders.length} retained for carts or orders, and ${products.length - placeholders.length} verified products.`)
  if (process.env.CONFIRM_PLACEHOLDER_CLEANUP !== "YES") {
    logger.warn("No products were deleted. Set CONFIRM_PLACEHOLDER_CLEANUP=YES to confirm this cleanup.")
    return
  }

  for (const batch of chunks(deletable, 100)) {
    await deleteProductsWorkflow(container).run({input: {ids: batch.map((product: any) => product.id)}})
  }
  if (retainedForOrders.length) {
    await updateProductsWorkflow(container).run({
      input: {
        products: retainedForOrders.map((product: any) => ({
          id: product.id,
          status: ProductStatus.DRAFT,
          metadata: {...(product.metadata ?? {}), placeholder_cleanup_retained: true},
        })),
      },
    })
  }
  logger.info(`Deleted ${deletable.length} placeholder products and removed ${retainedForOrders.length} reserved placeholders from the storefront. Verified products were preserved.`)
}
