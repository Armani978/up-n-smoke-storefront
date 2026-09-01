import { model } from "@medusajs/framework/utils"

const StorefrontContent = model.define("storefront_content", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  content: model.json(),
})

export default StorefrontContent
