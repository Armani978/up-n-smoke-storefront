import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { NicotineWarning } from "@/components/storefront/nicotine-warning";
import { getCatalog } from "@/lib/medusa/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = [...new Set((await getCatalog()).map((product) => product.category))]
    .filter((category) => category !== "Other")
    .sort((left, right) => left.localeCompare(right));

  return (
    <div className="store-shell">
      <div className="store-chrome">
        <NicotineWarning />
        <StoreHeader categories={categories} />
      </div>
      {children}
      <StoreFooter />
    </div>
  );
}
