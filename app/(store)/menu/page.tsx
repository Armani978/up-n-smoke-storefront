import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/storefront/catalog-explorer";
import { getCatalog } from "@/lib/medusa/catalog";

export const metadata: Metadata = { title: "Live Menu" };

export default async function MenuPage() {
  const products = await getCatalog();
  return (
    <main className="menu-page">
      <header className="page-banner">
        <span className="eyebrow">GEEK BAR + RAZ / Manchester pickup</span>
        <h1>FLAVOR<br /><em>WALL.</em></h1>
        <p>Filter by brand, search device or flavor, and reserve only what the Manchester counter has ready.</p>
      </header>
      <CatalogExplorer products={products} />
    </main>
  );
}
