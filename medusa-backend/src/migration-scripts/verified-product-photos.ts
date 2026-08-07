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
    fields: ["sku", "product.id", "product.title", "product.metadata"],
  })
  const bySku = new Map(variants.map((variant: any) => [String(variant.sku ?? "").toLowerCase(), variant]))
  const byExactTitle = new Map(variants.map((variant: any) => [String(variant.product?.title ?? "").trim().toLowerCase(), variant]))

  const updates = verifiedPhotos.flatMap((photo) => {
    const variant: any = photo.sku
      ? bySku.get(photo.sku.toLowerCase())
      : byExactTitle.get(String(photo.exactTitle).trim().toLowerCase())
    const identity = photo.sku ?? `title "${photo.exactTitle}"`
    if (!variant?.product?.id) {
      logger.warn(`Verified product photo skipped; ${identity} was not found.`)
      return []
    }
    return [{
      id: variant.product.id,
      thumbnail: photo.thumbnail,
      metadata: {
        ...(variant.product.metadata ?? {}),
        photo_verified: true,
        photo_verified_upc: photo.sku ?? null,
        photo_verified_title: photo.exactTitle ?? variant.product.title,
        photo_sku: photo.sku,
        photo_source: photo.source,
        photo_source_url: photo.sourceUrl,
      },
    }]
  })

  if (updates.length) {
    await updateProductsWorkflow(container).run({input: {products: updates}})
  }
  logger.info(`Applied ${updates.length} verified product photos.`)
}
