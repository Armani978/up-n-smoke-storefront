import { model } from "@medusajs/framework/utils"
import PickupVerification from "./pickup-verification"

const PickupAuditEvent = model.define("pickup_audit_event", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  employee_id: model.text().nullable(),
  event_type: model.enum([
    "pickup_qr_scanned",
    "order_opened_for_verification",
    "age_verification_passed",
    "age_verification_failed",
    "pickup_completed",
  ]),
  verification_method: model.enum(["manual_dob", "id_scan", "visual_check"]).nullable(),
  result: model.text().nullable(),
  metadata: model.json().nullable(),
  verification: model.belongsTo(() => PickupVerification, { mappedBy: "audit_events" }),
})

export default PickupAuditEvent
