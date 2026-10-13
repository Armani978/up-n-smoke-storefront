import { model } from "@medusajs/framework/utils"

const PickupVerification = model.define("pickup_verification", {
  id: model.id().primaryKey(),
  order_id: model.text().unique(),
  token_hash: model.text().unique(),
  token_expires_at: model.dateTime().nullable(),
  status: model.enum(["active", "processing", "completed", "revoked", "expired"]).default("active"),
  requires_age_verification: model.boolean().default(true),
  age_verified: model.boolean().nullable(),
  verification_method: model.enum(["manual_dob", "id_scan", "visual_check"]).nullable(),
  completed_at: model.dateTime().nullable(),
  completed_by: model.text().nullable(),
})

export default PickupVerification
