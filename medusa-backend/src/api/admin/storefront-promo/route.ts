import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { currentPromo, DEFAULT_PROMO, PROMO_KEY, promoService } from "../../storefront-promo-helpers"

const productSchema = z.object({
  handle: z.string().trim().max(180),
  label: z.string().trim().min(1).max(80),
  imageUrl: z.string().trim().min(1).max(500),
})

const promoSchema = z.object({
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
  return res.json({ promo: await currentPromo(req) })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const parsed = promoSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid promo settings." })

  const service = promoService(req)
  const [existing] = await service.listStorefrontPromos({ key: PROMO_KEY }, { take: 1 })
  const input = {
    key: PROMO_KEY,
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
