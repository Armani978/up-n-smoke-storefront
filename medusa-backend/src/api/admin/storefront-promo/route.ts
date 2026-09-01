import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { currentPromos, DEFAULT_PROMO, MAX_STOREFRONT_PROMOS, PROMO_KEY, promoService } from "../../storefront-promo-helpers"

const productSchema = z.object({
  handle: z.string().trim().max(180),
  label: z.string().trim().min(1).max(80),
  imageUrl: z.string().trim().min(1).max(500),
})

const promoSchema = z.object({
  key: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  active: z.boolean(),
  campaignName: z.string().trim().min(1).max(80),
  headline: z.string().trim().min(1).max(90),
  supportingCopy: z.string().trim().min(1).max(220),
  ctaLabel: z.string().trim().min(1).max(32),
  ctaHref: z.string().trim().min(1).max(300).refine((value) => value.startsWith("/") || value.startsWith("https://"), "Button link must be a site path or HTTPS URL."),
  heroImageUrl: z.string().trim().min(1).max(500).refine((value) => value.startsWith("/") || value.startsWith("https://"), "Hero image must be a local path or HTTPS URL."),
  products: z.array(productSchema).max(2),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ promos: await currentPromos(req) })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const parsed = promoSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid promo settings." })

  const service = promoService(req)
  const [existing] = await service.listStorefrontPromos({ key: parsed.data.key }, { take: 1 })
  if (!existing) {
    const existingPromos = await service.listStorefrontPromos({}, { take: MAX_STOREFRONT_PROMOS + 1 })
    if (existingPromos.length >= MAX_STOREFRONT_PROMOS) return res.status(409).json({ message: `A maximum of ${MAX_STOREFRONT_PROMOS} promotions is allowed.` })
  }
  const input = {
    key: parsed.data.key || PROMO_KEY,
    active: parsed.data.active,
    campaign_name: parsed.data.campaignName,
    headline: parsed.data.headline,
    supporting_copy: parsed.data.supportingCopy,
    cta_label: parsed.data.ctaLabel,
    cta_href: parsed.data.ctaHref,
    hero_image_url: parsed.data.heroImageUrl,
    products: parsed.data.products.length ? parsed.data.products : DEFAULT_PROMO.products,
  }
  const promo = existing
    ? await service.updateStorefrontPromos({ id: existing.id, ...input })
    : await service.createStorefrontPromos(input)
  return res.json({ promo })
}
