import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/storefront/catalog-explorer";
import { getCatalog } from "@/lib/medusa/catalog";
import { getStorefrontContent } from "@/lib/storefront-content";

export const metadata: Metadata = { title: "Live Menu" };

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const [products, content] = await Promise.all([getCatalog(), getStorefrontContent()]);
  const requestedCategory = (await searchParams).category;
  const requestedValue = Array.isArray(requestedCategory) ? requestedCategory[0] : requestedCategory;
  const selectedCategory = products.find((product) => product.category.toLowerCase() === requestedValue?.toLowerCase())?.category ?? "All";
  return (
    <main className="menu-page">
      <header className="page-banner">
        <span className="eyebrow">{content.menu.eyebrow}</span>
        <h1>{content.menu.titleTop}<br /><em>{content.menu.titleAccent}</em></h1>
        <p>{content.menu.description}</p>
      </header>
      <CatalogExplorer key={selectedCategory} products={products} initialCategory={selectedCategory} />
    </main>
  );
}
