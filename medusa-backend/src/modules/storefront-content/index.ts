import { Module } from "@medusajs/framework/utils"
import StorefrontContentModuleService from "./service"

export const STOREFRONT_CONTENT_MODULE = "storefrontContent"

export default Module(STOREFRONT_CONTENT_MODULE, { service: StorefrontContentModuleService })
