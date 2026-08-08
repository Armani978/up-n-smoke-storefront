import { fallbackProducts } from "@/lib/catalog-fallback";
import { MEDUSA_BACKEND_URL, isMedusaConfigured, storeHeaders } from "@/lib/medusa/config";
import type { StoreProduct } from "@/lib/types";

const accents = ["#dfff44", "#74e8ff", "#ffdd52"];

type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  thumbnail?: string | null;
  images?: { url: string }[];
  categories?: { name: string }[];
  metadata?: Record<string, unknown> | null;
  variants?: Array<{
    id: string;
    sku?: string | null;
    inventory_quantity?: number;
    calculated_price?: { calculated_amount?: number; currency_code?: string };
    prices?: Array<{ amount: number; currency_code: string }>;
  }>;
};

export function mapMedusaProduct(product: MedusaProduct, index: number): StoreProduct {
  const variant = product.variants?.[0];
  const metadata = product.metadata ?? {};
  const brand = String(metadata.brand ?? product.categories?.[0]?.name ?? "UP N SMOKE");
  const line = String(metadata.product_line ?? "Pickup selection");
  const flavor = String(metadata.flavor ?? product.title);
  const nicotine = String(metadata.nicotine ?? "21+");
  const puffs = String(metadata.puffs ?? "Ready");
  const price =
    variant?.calculated_price?.calculated_amount ??
    variant?.prices?.find((item) => item.currency_code === "usd")?.amount ??
    0;
  const stock = Math.max(0, Number(variant?.inventory_quantity ?? 0));
  const sourceImage = product.thumbnail ?? product.images?.[0]?.url;
  const image = !sourceImage || sourceImage.includes("1609592806596")
    ? "/product-placeholder.svg"
    : sourceImage;

  return {
    id: product.id,
    variantId: variant?.id ?? "",
    name: product.title,
    handle: product.handle,
    sku: variant?.sku ?? product.handle,
    category: product.categories?.[0]?.name ?? "Other",
    description: product.description ?? "Available for fast in-store pickup.",
    image,
    price: Number(price),
    stock,
    accent: brand === "RAZ" ? "#74e8ff" : accents[index % accents.length],
    signals: [
      { label: "Puffs", value: puffs },
      { label: "Nicotine", value: nicotine },
      { label: "Pickup", value: "15 min" },
    ],
    brand,
    line,
    flavor,
    nicotine,
    puffs,
  };
}

export async function getCatalog(): Promise<StoreProduct[]> {
  if (!isMedusaConfigured) return fallbackProducts;

  try {
    const regionResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/regions?limit=20`, {
      headers: storeHeaders(),
      next: { revalidate: 60, tags: ["catalog"] },
    });
    if (!regionResponse.ok) throw new Error("Unable to load region");
    const { regions } = (await regionResponse.json()) as { regions: Array<{ id: string; currency_code: string }> };
    const region = regions.find((item) => item.currency_code === "usd") ?? regions[0];
    if (!region) return fallbackProducts;

    const products: MedusaProduct[] = [];
    let offset = 0;
    let count = 1;
    while (offset < count && offset < 2000) {
      const params = new URLSearchParams({
        limit: "100",
        offset: String(offset),
        region_id: region.id,
        fields: "*variants.calculated_price,+variants.inventory_quantity,+categories,+images",
      });
      const response = await fetch(`${MEDUSA_BACKEND_URL}/store/products?${params}`, {
        headers: storeHeaders(),
        next: { revalidate: 60, tags: ["catalog"] },
      });
      if (!response.ok) throw new Error("Unable to load products");
      const page = (await response.json()) as { products: MedusaProduct[]; count?: number };
      products.push(...page.products);
      count = page.count ?? products.length;
      offset += page.products.length;
      if (!page.products.length) break;
    }
    return products.length ? products.map(mapMedusaProduct) : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function getProduct(handleOrId: string) {
  const products = await getCatalog();
  return products.find((product) => product.handle === handleOrId || product.id === handleOrId) ?? null;
}
