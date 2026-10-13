import type { MedusaRequest } from "@medusajs/framework/http"
import { STOREFRONT_PROMO_MODULE } from "../modules/storefront-promo"

export const PROMO_KEY = "homepage"
export const MAX_STOREFRONT_PROMOS = 8

export const DEFAULT_PROMO = {
  key: PROMO_KEY,
  active: true,
  campaign_name: "Geek Bar Pulse drop",
  headline: "THE NEW PULSE JUST LANDED.",
  supporting_copy: "PULSE X 2 and PULSE 2 are in store now. Reserve yours for pickup.",
  cta_label: "SHOP THE DROP",
  cta_href: "/menu",
  hero_image_url: "/promos/geekbar-pulse-x2-official.jpg",
  products: [
    { handle: "", label: "PULSE X 2", imageUrl: "/promos/geekbar-pulse-x2-product.jpg" },
    { handle: "", label: "PULSE 2", imageUrl: "/promos/geekbar-pulse-2-product.jpg" },
  ],
}

export type StorefrontPromoService = {
  listStorefrontPromos: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any[]>
  createStorefrontPromos: (data: Record<string, unknown>) => Promise<any>
  updateStorefrontPromos: (data: Record<string, unknown>) => Promise<any>
}

export function promoService(req: MedusaRequest) {
  return req.scope.resolve(STOREFRONT_PROMO_MODULE) as unknown as StorefrontPromoService
}

export async function currentPromo(req: MedusaRequest) {
  return (await currentPromos(req))[0] ?? DEFAULT_PROMO
}

export async function currentPromos(req: MedusaRequest) {
  const promos = await promoService(req).listStorefrontPromos({}, { take: MAX_STOREFRONT_PROMOS, order: { updated_at: "DESC" } })
  return promos.length ? promos : [DEFAULT_PROMO]
}
