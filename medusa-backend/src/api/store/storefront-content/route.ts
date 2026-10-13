import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { currentStorefrontContent } from "../../storefront-content-helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ content: await currentStorefrontContent(req) })
}
