import { MedusaService } from "@medusajs/framework/utils"
import PickupVerification from "./models/pickup-verification"
import PickupAuditEvent from "./models/pickup-audit-event"

class PickupVerificationModuleService extends MedusaService({
  PickupVerification,
  PickupAuditEvent,
}) {}

export default PickupVerificationModuleService
