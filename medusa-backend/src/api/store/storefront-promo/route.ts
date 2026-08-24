import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { currentPromo } from "../../storefront-promo-helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ promo: await currentPromo(req) })
}
