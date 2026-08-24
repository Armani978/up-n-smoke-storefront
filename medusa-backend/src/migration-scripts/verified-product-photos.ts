import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

type VerifiedPhoto = {
  sku?: string
  exactTitle?: string
  thumbnail: string
  source: string
  sourceUrl: string
}

const LOGO_FALLBACK = "/up-n-smoke-logo.png"
const PLACEHOLDER_FRAGMENTS = ["product-placeholder", "placehold.co", "1609592806596"]

const verifiedPhotos: readonly VerifiedPhoto[] = [
  {
    sku: "784762990235",
    thumbnail: "/product-images/784762990235.jpg",
    source: "UPCitemdb / Sears product CDN",
    sourceUrl: "http://c.shld.net/rpx/i/s/pi/mp/29862/2277106214",
  },
  {
    sku: "850046584060",
    thumbnail: "/product-images/850046584060.jpg",
    source: "My Smoke Wholesale",
    sourceUrl: "https://www.mysmokewholesale.com/850046584060-1.html",
  },
  {
    sku: "10036882107176",
    thumbnail: "/product-images/10036882107176.jpg",
    source: "MIG Distro",
    sourceUrl: "https://migdistro.com/products/detail?Id=715293916&name=pipe+screen+100ct+silver+%2F+gold",
  },
  {
    sku: "894236021225",
    thumbnail: "/product-images/894236021225.jpg",
    source: "Empire Smoke Distributors / Lotus",
    sourceUrl: "https://empiresmokedist.com/product/lotus-meteor-round-64-rg-cigar-cutter/",
  },
  {
    sku: "784762991300",
    thumbnail: "/product-images/784762991300.jpg",
    source: "Zig-Zag official store",
    sourceUrl: "https://zigzag.com/products/zig-zag-glass-ashtray-classic",
  },
]

export default async function applyVerifiedProductPhotos({container}: {container: MedusaContainer}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {data: variants} = await query.graph({
    entity: "product_variant",
    fields: ["sku", "product.id", "product.title", "product.thumbnail", "product.metadata"],
  })
  const photoBySku = new Map(verifiedPhotos.flatMap((photo) => photo.sku ? [[photo.sku.toLowerCase(), photo] as const] : []))
  const photoByTitle = new Map(verifiedPhotos.flatMap((photo) => photo.exactTitle ? [[photo.exactTitle.trim().toLowerCase(), photo] as const] : []))
  const products = new Map<string, any>()
  for (const variant of variants as any[]) {
    if (variant.product?.id && !products.has(variant.product.id)) products.set(variant.product.id, variant)
  }

  let verifiedCount = 0
  let existingCount = 0
  let fallbackCount = 0
  const updates = Array.from(products.values()).flatMap((variant: any) => {
    const product = variant.product
    const sku = String(variant.sku ?? "").trim()
    const photo = photoBySku.get(sku.toLowerCase()) ?? photoByTitle.get(String(product.title ?? "").trim().toLowerCase())
    const currentThumbnail = String(product.thumbnail ?? "").trim()
    const currentIsUsable = Boolean(currentThumbnail) && !PLACEHOLDER_FRAGMENTS.some((fragment) => currentThumbnail.includes(fragment)) && currentThumbnail !== LOGO_FALLBACK
    const thumbnail = photo?.thumbnail ?? (currentIsUsable ? currentThumbnail : LOGO_FALLBACK)

    if (photo) verifiedCount += 1
    else if (currentIsUsable) existingCount += 1
    else fallbackCount += 1

    const metadata = photo ? {
      ...(product.metadata ?? {}),
      photo_verified: true,
      photo_verified_upc: photo.sku ?? null,
      photo_verified_title: photo.exactTitle ?? product.title,
      photo_sku: photo.sku,
      photo_source: photo.source,
      photo_source_url: photo.sourceUrl,
    } : thumbnail === LOGO_FALLBACK ? {
      ...(product.metadata ?? {}),
      photo_verified: false,
      photo_source: "up_n_smoke_logo_fallback",
    } : product.metadata

    if (currentThumbnail === thumbnail && (!photo || product.metadata?.photo_verified === true)) return []
    return [{ id: product.id, thumbnail, metadata }]
  })

  const dryRun = ["1", "true", "yes"].includes(String(process.env.PHOTO_DRY_RUN ?? "").toLowerCase())
  if (!dryRun) {
    for (let index = 0; index < updates.length; index += 100) {
      await updateProductsWorkflow(container).run({input: {products: updates.slice(index, index + 100)}})
    }
  }
  logger.info(`${dryRun ? "Audited" : "Applied"} product photos: ${products.size} total, ${verifiedCount} verified matches, ${existingCount} existing photos, ${fallbackCount} logo fallbacks, ${updates.length} updates${dryRun ? " pending" : ""}.`)
}
