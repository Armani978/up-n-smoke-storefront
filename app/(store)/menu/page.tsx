import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/storefront/catalog-explorer";
import { getCatalog } from "@/lib/medusa/catalog";

export const metadata: Metadata = { title: "Live Menu" };

export default async function MenuPage() {
  const products = await getCatalog();
  return (
    <main className="menu-page">
      <header className="page-banner">
        <span className="eyebrow">Live Manchester inventory</span>
        <h1>THE<br /><em>MENU.</em></h1>
        <p>Search the wall, filter the drop, and reserve only what’s physically ready at the counter.</p>
      </header>
      <CatalogExplorer products={products} />
    </main>
  );
}
