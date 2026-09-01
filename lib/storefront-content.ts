import "server-only"

import { MEDUSA_BACKEND_URL, storeHeaders } from "@/lib/medusa/config"

export type StorefrontContent = {
  home: { kicker: string; titleTop: string; titleAccent: string; titleBottom: string; ctaLabel: string }
  menu: { eyebrow: string; titleTop: string; titleAccent: string; description: string }
}

export const DEFAULT_STOREFRONT_CONTENT: StorefrontContent = {
  home: { kicker: "Manchester’s 21+ pickup counter", titleTop: "FLAVOR.", titleAccent: "LOCKED.", titleBottom: "LOCAL.", ctaLabel: "Browse the live wall" },
  menu: { eyebrow: "GEEK BAR + RAZ / Manchester pickup", titleTop: "FLAVOR", titleAccent: "WALL.", description: "Filter by brand, search device or flavor, and reserve only what the Manchester counter has ready." },
}

function text(value: unknown, fallback: string, max: number) {
  const normalized = String(value ?? "").trim()
  return (normalized || fallback).slice(0, max)
}

export function normalizeStorefrontContent(value: unknown): StorefrontContent {
  const content = (value ?? {}) as Record<string, unknown>
  const home = (content.home ?? {}) as Record<string, unknown>
  const menu = (content.menu ?? {}) as Record<string, unknown>
  return {
    home: {
      kicker: text(home.kicker, DEFAULT_STOREFRONT_CONTENT.home.kicker, 90), titleTop: text(home.titleTop, DEFAULT_STOREFRONT_CONTENT.home.titleTop, 40),
      titleAccent: text(home.titleAccent, DEFAULT_STOREFRONT_CONTENT.home.titleAccent, 40), titleBottom: text(home.titleBottom, DEFAULT_STOREFRONT_CONTENT.home.titleBottom, 40), ctaLabel: text(home.ctaLabel, DEFAULT_STOREFRONT_CONTENT.home.ctaLabel, 50),
    },
    menu: { eyebrow: text(menu.eyebrow, DEFAULT_STOREFRONT_CONTENT.menu.eyebrow, 90), titleTop: text(menu.titleTop, DEFAULT_STOREFRONT_CONTENT.menu.titleTop, 60), titleAccent: text(menu.titleAccent, DEFAULT_STOREFRONT_CONTENT.menu.titleAccent, 60), description: text(menu.description, DEFAULT_STOREFRONT_CONTENT.menu.description, 240) },
  }
}

export async function getStorefrontContent(): Promise<StorefrontContent> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/store/storefront-content`, { headers: storeHeaders(), next: { revalidate: 30, tags: ["storefront-content"] } })
    if (!response.ok) return DEFAULT_STOREFRONT_CONTENT
    return normalizeStorefrontContent((await response.json() as { content?: unknown }).content)
  } catch {
    return DEFAULT_STOREFRONT_CONTENT
  }
}
