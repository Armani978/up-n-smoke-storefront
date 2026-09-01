import { model } from "@medusajs/framework/utils"

const PickupAuditEvent = model.define("pickup_audit_event", {
  id: model.id().primaryKey(),
  // Audit events are intentionally associated by ID rather than a model
  // relationship. Both models live in the same custom module and the service
  // only creates/reads them through this field; keeping it scalar avoids an
  // invalid cross-module relationship declaration.
  verification_id: model.text(),
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
})

export default PickupAuditEvent
