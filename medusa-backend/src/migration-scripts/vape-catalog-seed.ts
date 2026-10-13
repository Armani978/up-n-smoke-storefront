import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

const products = [
  {
    brand: "GEEK BAR",
    line: "Pulse X",
    flavor: "Miami Mint",
    sku: "GB-PX-MIAMI-MINT",
    handle: "geek-bar-pulse-x-miami-mint",
    price: 24.99,
    puffs: "25K",
    nicotine: "5%",
    description: "Cool Miami mint in the GEEK BAR Pulse X platform with dual mesh coils, a curved display, and USB-C quick charging.",
    thumbnail: "https://oss.geekbar.com/products/pulsex/13.png",
    sourceUrl: "https://www.geekbar.com/product/PulseX.html",
  },
  {
    brand: "GEEK BAR",
    line: "Pulse X",
    flavor: "Blue Rancher",
    sku: "GB-PX-BLUE-RANCHER",
    handle: "geek-bar-pulse-x-blue-rancher",
    price: 24.99,
    puffs: "25K",
    nicotine: "5%",
    description: "Bold blue candy flavor on the Pulse X platform with regular and Pulse modes, dual mesh coils, and a live display.",
    thumbnail: "https://oss.geekbar.com/products/pulsex/12.png",
    sourceUrl: "https://www.geekbar.com/product/PulseX.html",
  },
  {
    brand: "GEEK BAR",
    line: "Pulse X",
    flavor: "Strawberry B-Pop",
    sku: "GB-PX-STRAWBERRY-BPOP",
    handle: "geek-bar-pulse-x-strawberry-b-pop",
    price: 24.99,
    puffs: "25K",
    nicotine: "5%",
    description: "Strawberry candy and ice on GEEK BAR's Pulse X hardware with an 18 mL fill, dual mesh coil, and quick charge.",
    thumbnail: "https://oss.geekbar.com/products/pulsex/14.png",
    sourceUrl: "https://www.geekbar.com/product/PulseX.html",
  },
  {
    brand: "RAZ",
    line: "DC25000 / LTX 25K",
    flavor: "Razzle Dazzle",
    sku: "RAZ-LTX25K-RAZZLE-DAZZLE",
    handle: "raz-ltx-25k-razzle-dazzle",
    price: 22.99,
    puffs: "25K",
    nicotine: "5%",
    description: "Sweet raspberry, bright lime, and a light cool finish in the RAZ DC25000 / LTX 25K dual-mode platform.",
    thumbnail: "https://www.raz-vape.com/wp-content/uploads/2026/03/Razzle-Dazzle-Raz-LTX-25K.webp",
    sourceUrl: "https://www.raz-vape.com/products/razzle-dazzle-raz-dc25000-disposable-vape/",
  },
  {
    brand: "RAZ",
    line: "VUE 50K",
    flavor: "Blue Raz Ice",
    sku: "RAZ-VUE50K-BLUE-RAZ-ICE",
    handle: "raz-vue-50k-blue-raz-ice",
    price: 23.99,
    puffs: "50K",
    nicotine: "5%",
    description: "Blue raspberry candy with a clean ice finish in the reusable RAZ VUE 50K battery-and-pod platform.",
    thumbnail: "https://www.raz-vape.com/wp-content/uploads/2026/02/Blue-Raz-Ice-RAZ-VUE-50K-Kit.webp",
    sourceUrl: "https://www.raz-vape.com/products/blue-raz-ice-raz-vape/",
  },
  {
    brand: "RAZ",
    line: "TN9000",
    flavor: "Ruby",
    sku: "RAZ-TN9000-RUBY",
    handle: "raz-tn9000-ruby",
    price: 19.99,
    puffs: "9K",
    nicotine: "5%",
    description: "Strawberry, black cherry, and raspberry in the compact, draw-activated RAZ TN9000 with USB-C charging.",
    thumbnail: "https://www.raz-vape.com/wp-content/uploads/2025/09/8dc04cb473b65e7c1391663bda5bc1e2.webp",
    sourceUrl: "https://www.raz-vape.com/products/raz-tn9000-raz-vape-9000-puffs-disposable/",
  },
] as const

export default async function seedVapeCatalog({container}: {container: MedusaContainer}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const [existingVariants, profilesResult, channelsResult, categoriesResult, locationsResult] = await Promise.all([
    query.graph({entity: "product_variant", fields: ["sku"]}),
    query.graph({entity: "shipping_profile", fields: ["id", "type"]}),
    query.graph({entity: "sales_channel", fields: ["id", "name"]}),
    query.graph({entity: "product_category", fields: ["id", "name"]}),
    query.graph({entity: "stock_location", fields: ["id", "name"]}),
  ])

  const shippingProfile = profilesResult.data.find((profile: any) => profile.type === "default") ?? profilesResult.data[0]
  const salesChannel = channelsResult.data.find((channel: any) => /up n smoke|online pickup/i.test(channel.name)) ?? channelsResult.data[0]
  const stockLocation = locationsResult.data.find((location: any) => /manchester/i.test(location.name)) ?? locationsResult.data[0]
  if (!shippingProfile || !salesChannel || !stockLocation) {
    throw new Error("Shipping profile, pickup sales channel, or stock location is missing.")
  }

  const categoryByName = new Map(categoriesResult.data.map((category: any) => [String(category.name).toLowerCase(), category]))
  const missingBrands = ["GEEK BAR", "RAZ"].filter((brand) => !categoryByName.has(brand.toLowerCase()))
  if (missingBrands.length) {
    const {result: createdCategories} = await createProductCategoriesWorkflow(container).run({
      input: {product_categories: missingBrands.map((name) => ({name, is_active: true}))},
    })
    for (const category of createdCategories) categoryByName.set(category.name.toLowerCase(), category)
  }

  const existingSkus = new Set(existingVariants.data.map((variant: any) => String(variant.sku).toLowerCase()))
  const missingProducts = products.filter((product) => !existingSkus.has(product.sku.toLowerCase()))
  if (missingProducts.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: missingProducts.map((product) => ({
          title: `${product.brand} ${product.line} — ${product.flavor}`,
          handle: product.handle,
          subtitle: product.flavor,
          description: product.description,
          thumbnail: product.thumbnail,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [categoryByName.get(product.brand.toLowerCase()).id],
          metadata: {
            brand: product.brand,
            product_line: product.line,
            flavor: product.flavor,
            puffs: product.puffs,
            nicotine: product.nicotine,
            age_restricted: true,
            minimum_age: 21,
            photo_verified: true,
            photo_source: product.brand === "RAZ" ? "RAZ official store" : "GEEK BAR official",
            photo_source_url: product.sourceUrl,
          },
          options: [{title: "Flavor", values: [product.flavor]}],
          variants: [{
            title: product.flavor,
            sku: product.sku,
            manage_inventory: true,
            options: {Flavor: product.flavor},
            prices: [{currency_code: "usd", amount: product.price}],
          }],
          sales_channels: [{id: salesChannel.id}],
        })),
      },
    })
  }

  const {data: inventoryItems} = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.id"],
  })
  const productSkus = new Set(products.map((product) => product.sku.toLowerCase()))
  const missingLevels = inventoryItems.flatMap((item: any) =>
    productSkus.has(String(item.sku).toLowerCase()) && !item.location_levels?.length
      ? [{location_id: stockLocation.id, inventory_item_id: item.id, stocked_quantity: 0}]
      : []
  )
  if (missingLevels.length) {
    await createInventoryLevelsWorkflow(container).run({input: {inventory_levels: missingLevels}})
  }

  logger.info(`Vape catalog ready: ${missingProducts.length} products created, ${missingLevels.length} inventory levels initialized at zero.`)
}
