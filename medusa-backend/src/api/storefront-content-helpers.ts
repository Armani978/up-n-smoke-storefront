import type { MedusaRequest } from "@medusajs/framework/http"
import { STOREFRONT_CONTENT_MODULE } from "../modules/storefront-content"

export const STOREFRONT_CONTENT_KEY = "marketing-pages"

export const DEFAULT_STOREFRONT_CONTENT = {
  home: {
    kicker: "Manchester’s 21+ pickup counter",
    titleTop: "FLAVOR.",
    titleAccent: "LOCKED.",
    titleBottom: "LOCAL.",
    ctaLabel: "Browse the live wall",
  },
  menu: {
    eyebrow: "GEEK BAR + RAZ / Manchester pickup",
    titleTop: "FLAVOR",
    titleAccent: "WALL.",
    description: "Filter by brand, search device or flavor, and reserve only what the Manchester counter has ready.",
  },
}

type StorefrontContentService = {
  listStorefrontContents: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<Array<{ content?: unknown }>>
}

export function storefrontContentService(req: MedusaRequest) {
  return req.scope.resolve(STOREFRONT_CONTENT_MODULE) as StorefrontContentService
}

export async function currentStorefrontContent(req: MedusaRequest) {
  const [entry] = await storefrontContentService(req).listStorefrontContents({ key: STOREFRONT_CONTENT_KEY }, { take: 1 })
  return entry?.content ?? DEFAULT_STOREFRONT_CONTENT
}
