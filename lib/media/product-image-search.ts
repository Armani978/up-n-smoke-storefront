import "server-only";

import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";
import type { EmployeeSession, ProductImageSearchResult } from "@/lib/types";

type SearchProvider = {
  search: (query: string) => Promise<ProductImageSearchResult[]>;
};

function safeUrl(value: unknown) {
  const url = String(value ?? "").trim();
  return url.startsWith("https://") ? url : "";
}

function preferredScore(url: string, title: string, productName: string) {
  const host = new URL(url).hostname.toLowerCase();
  const text = `${host} ${title}`.toLowerCase();
  const brand = productName.toLowerCase().split(/\s+/)[0];
  const preferred = (process.env.PRODUCT_IMAGE_PREFERRED_DOMAINS ?? "")
    .split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  if (preferred.some((domain) => host === domain || host.endsWith(`.${domain}`))) return 0;
  if ((brand === "geek" && host.includes("geekbar")) || (brand === "raz" && host.includes("raz-vape"))) return 1;
  if (/distributor|wholesale|distro/.test(text)) return 2;
  if (/smoke|vape|retail|shop/.test(text)) return 3;
  return 4;
}

function serpApiProvider(): SearchProvider | null {
  const key = process.env.SERPAPI_API_KEY;
  if (!key || process.env.PRODUCT_IMAGE_SEARCH_PROVIDER !== "serpapi") return null;
  return {
    async search(query) {
      const params = new URLSearchParams({ engine: "google_images", q: query, api_key: key, num: "12" });
      const response = await fetch(`https://serpapi.com/search.json?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("The configured image search provider did not respond.");
      const payload = await response.json() as { images_results?: Array<Record<string, unknown>> };
      return (payload.images_results ?? []).map((item) => {
        const imageUrl = safeUrl(item.original ?? item.thumbnail);
        const sourceUrl = safeUrl(item.link ?? item.source_link);
        return {
          id: `${imageUrl}|${sourceUrl}`,
          imageUrl,
          source: String(item.source ?? new URL(sourceUrl || imageUrl).hostname),
          sourceUrl,
          title: String(item.title ?? "Product image"),
        };
      }).filter((item) => item.imageUrl && item.sourceUrl);
    },
  };
}

export async function findProductImages(session: EmployeeSession, productId: string) {
  const provider = serpApiProvider();
  if (!provider) return { available: false as const, results: [] as ProductImageSearchResult[], message: "Image search is not configured. Set PRODUCT_IMAGE_SEARCH_PROVIDER=serpapi and SERPAPI_API_KEY on the storefront server." };
  const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/products/${encodeURIComponent(productId)}?fields=title,*variants.sku,*categories.name`, {
    headers: { Authorization: `Bearer ${session.token}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to load the product for image search.");
  const { product } = await response.json() as { product: { title?: string; variants?: Array<{ sku?: string }>; categories?: Array<{ name?: string }> } };
  const name = String(product.title ?? "").trim();
  if (!name) throw new Error("This product has no name to search.");
  const query = [name, product.variants?.[0]?.sku, product.categories?.[0]?.name].filter(Boolean).join(" ");
  const results = await provider.search(query);
  return { available: true as const, results: results.sort((left, right) => preferredScore(left.sourceUrl, left.title, name) - preferredScore(right.sourceUrl, right.title, name)).slice(0, 8), message: "" };
}
