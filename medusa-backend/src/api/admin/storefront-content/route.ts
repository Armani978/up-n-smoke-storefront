import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { currentStorefrontContent, STOREFRONT_CONTENT_KEY } from "../../storefront-content-helpers"
import { upsertStorefrontContentWorkflow } from "../../../workflows/upsert-storefront-content"

const contentSchema = z.object({
  home: z.object({ kicker: z.string().trim().min(1).max(90), titleTop: z.string().trim().min(1).max(40), titleAccent: z.string().trim().min(1).max(40), titleBottom: z.string().trim().min(1).max(40), ctaLabel: z.string().trim().min(1).max(50) }),
  menu: z.object({ eyebrow: z.string().trim().min(1).max(90), titleTop: z.string().trim().min(1).max(60), titleAccent: z.string().trim().min(1).max(60), description: z.string().trim().min(1).max(240) }),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ content: await currentStorefrontContent(req) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = contentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid storefront content." })
  const { result } = await upsertStorefrontContentWorkflow(req.scope).run({ input: { key: STOREFRONT_CONTENT_KEY, content: parsed.data } })
  return res.json({ content: (result as { content: unknown }).content })
}
