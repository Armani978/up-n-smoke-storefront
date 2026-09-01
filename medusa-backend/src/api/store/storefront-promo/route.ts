import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { currentPromos } from "../../storefront-promo-helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ promos: (await currentPromos(req)).filter((promo) => promo.active) })
}
