import { PromoStory } from "@/components/storefront/promo-story";
import type { StorefrontPromo } from "@/lib/promo";
import type { StoreProduct } from "@/lib/types";

// Keep the existing homepage import and serialize only the advertised products.
export function PromoProducts({ promos, catalog }: { promos: StorefrontPromo[]; catalog: StoreProduct[] }) {
  const active = promos.filter((promo) => promo.active);
  const handles = new Set(active.flatMap((promo) => promo.products.map((selection) => selection.handle)));
  return <PromoStory promos={active} catalog={catalog.filter((product) => handles.has(product.handle))} />;
}
