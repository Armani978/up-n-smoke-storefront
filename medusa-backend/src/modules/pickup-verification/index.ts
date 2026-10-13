import { Module } from "@medusajs/framework/utils"
import PickupVerificationModuleService from "./service"

export const PICKUP_VERIFICATION_MODULE = "pickupVerification"

export default Module(PICKUP_VERIFICATION_MODULE, {
  service: PickupVerificationModuleService,
})
