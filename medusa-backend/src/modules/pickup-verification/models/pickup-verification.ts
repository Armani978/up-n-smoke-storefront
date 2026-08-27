import { model } from "@medusajs/framework/utils"
import PickupAuditEvent from "./pickup-audit-event"

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
  // eslint-disable-next-line @medusajs/link-no-cross-module-relationship -- PickupAuditEvent lives in this same module (src/modules/pickup-verification/models/); this rule's Windows path comparison (path.resolve's backslash-separated output vs. its own forward-slash-normalized moduleRoot) false-positives as "cross-module" on Windows only.
  audit_events: model.hasMany(() => PickupAuditEvent, { mappedBy: "verification" }),
})

export default PickupVerification
