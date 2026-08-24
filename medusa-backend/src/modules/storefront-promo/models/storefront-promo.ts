import { model } from "@medusajs/framework/utils"

const StorefrontPromo = model.define("storefront_promo", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  active: model.boolean().default(true),
  campaign_name: model.text(),
  headline: model.text(),
  supporting_copy: model.text(),
  cta_label: model.text(),
  cta_href: model.text(),
  hero_image_url: model.text(),
  products: model.json(),
})

export default StorefrontPromo
