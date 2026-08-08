import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getAge, isAtLeast21, localDateAt, parseDateOnly, STORE_TIMEZONE, getTwentyOneCutoffDate, toIsoDate } from "../../../../../modules/pickup-verification/age"
import { audit, pickupService } from "../../../../pickup-verification-helpers"

type Body = { date_of_birth?: string; method?: "manual_dob" }

export async function POST(req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse) {
  const service = pickupService(req)
  const [verification] = await service.listPickupVerifications({ id: req.params.id }, { take: 1 })
  if (!verification || verification.status !== "active") return void res.status(409).json({ message: "Pickup verification is no longer active." })
  const dob = parseDateOnly(String(req.body?.date_of_birth || ""))
  if (!dob) return void res.status(400).json({ message: "Enter a valid date of birth." })
  const today = localDateAt()
  if (dob.year < 1900 || getAge(dob, today) < 0) return void res.status(400).json({ message: "Enter a valid date of birth." })
  const age = getAge(dob, today)
  const passed = isAtLeast21(dob, today)
  await service.updatePickupVerifications({ id: verification.id, age_verified: passed, verification_method: "manual_dob" })
  await audit(service, verification, passed ? "age_verification_passed" : "age_verification_failed", req.auth_context?.actor_id, {
    verification_method: "manual_dob",
    result: passed ? "passed" : "failed",
  })
  res.json({ age, passed, today: toIsoDate(today), cutoff: toIsoDate(getTwentyOneCutoffDate(today)), timeZone: STORE_TIMEZONE })
}
