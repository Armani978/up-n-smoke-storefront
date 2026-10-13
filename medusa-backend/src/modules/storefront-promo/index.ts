import { Module } from "@medusajs/framework/utils"
import StorefrontPromoModuleService from "./service"

export const STOREFRONT_PROMO_MODULE = "storefrontPromo"

export default Module(STOREFRONT_PROMO_MODULE, {
  service: StorefrontPromoModuleService,
})
