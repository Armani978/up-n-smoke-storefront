import "server-only";

import { MEDUSA_BACKEND_URL, storeHeaders } from "@/lib/medusa/config";

export const NICOTINE_WARNING = "WARNING: This product contains nicotine. Nicotine is an addictive chemical.";

export type PromoProduct = {
  handle: string;
  label: string;
  imageUrl: string;
};

export type StorefrontPromo = {
  key: string;
  active: boolean;
  campaignName: string;
  headline: string;
  supportingCopy: string;
  ctaLabel: string;
  ctaHref: string;
  heroImageUrl: string;
  products: PromoProduct[];
  updatedAt?: string;
};

export const DEFAULT_STOREFRONT_PROMO: StorefrontPromo = {
  key: "homepage",
  active: true,
  campaignName: "Geek Bar Pulse drop",
  headline: "THE NEW PULSE JUST LANDED.",
  supportingCopy: "PULSE X 2 and PULSE 2 are in store now. Reserve yours for pickup.",
  ctaLabel: "SHOP THE DROP",
  ctaHref: "/menu",
  heroImageUrl: "/promos/geekbar-pulse-x2-official.jpg",
  products: [
    { handle: "", label: "PULSE X 2", imageUrl: "/promos/geekbar-pulse-x2-product.jpg" },
    { handle: "", label: "PULSE 2", imageUrl: "/promos/geekbar-pulse-2-product.jpg" },
  ],
};

function text(value: unknown, fallback: string, max: number) {
  const normalized = String(value ?? "").trim();
  return (normalized || fallback).slice(0, max);
}

function normalizeProducts(value: unknown): PromoProduct[] {
  if (!Array.isArray(value)) return DEFAULT_STOREFRONT_PROMO.products;
  return value.slice(0, 2).map((item, index) => {
    const product = (item ?? {}) as Record<string, unknown>;
    const fallback = DEFAULT_STOREFRONT_PROMO.products[index] ?? DEFAULT_STOREFRONT_PROMO.products[0];
    return {
      handle: text(product.handle, "", 180),
      label: text(product.label, fallback.label, 80),
      imageUrl: text(product.imageUrl ?? product.image_url, fallback.imageUrl, 500),
    };
  });
}

export function normalizeStorefrontPromo(value: unknown): StorefrontPromo {
  const promo = (value ?? {}) as Record<string, unknown>;
  return {
    key: text(promo.key, DEFAULT_STOREFRONT_PROMO.key, 80),
    active: promo.active === undefined ? DEFAULT_STOREFRONT_PROMO.active : Boolean(promo.active),
    campaignName: text(promo.campaignName ?? promo.campaign_name, DEFAULT_STOREFRONT_PROMO.campaignName, 80),
    headline: text(promo.headline, DEFAULT_STOREFRONT_PROMO.headline, 90),
    supportingCopy: text(promo.supportingCopy ?? promo.supporting_copy, DEFAULT_STOREFRONT_PROMO.supportingCopy, 220),
    ctaLabel: text(promo.ctaLabel ?? promo.cta_label, DEFAULT_STOREFRONT_PROMO.ctaLabel, 32),
    ctaHref: text(promo.ctaHref ?? promo.cta_href, DEFAULT_STOREFRONT_PROMO.ctaHref, 300),
    heroImageUrl: text(promo.heroImageUrl ?? promo.hero_image_url, DEFAULT_STOREFRONT_PROMO.heroImageUrl, 500),
    products: normalizeProducts(promo.products),
    updatedAt: promo.updatedAt ? String(promo.updatedAt) : promo.updated_at ? String(promo.updated_at) : undefined,
  };
}

export async function getStorefrontPromos(): Promise<StorefrontPromo[]> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/store/storefront-promo`, {
      headers: storeHeaders(),
      next: { revalidate: 30, tags: ["storefront-promo"] },
    });
    if (!response.ok) return [DEFAULT_STOREFRONT_PROMO];
    const payload = await response.json() as { promos?: unknown[] };
    return Array.isArray(payload.promos) ? payload.promos.map(normalizeStorefrontPromo) : [DEFAULT_STOREFRONT_PROMO];
  } catch {
    return [DEFAULT_STOREFRONT_PROMO];
  }
}
