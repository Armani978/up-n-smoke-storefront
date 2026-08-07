"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/lib/types";

export function CatalogExplorer({ products }: { products: StoreProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [limit, setLimit] = useState(48);
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const shown = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatches = category === "All" || product.category === category;
      const queryMatches = !normalized || [product.name, product.sku, product.category, product.description]
        .some((value) => value.toLowerCase().includes(normalized));
      return categoryMatches && queryMatches;
    });
  }, [products, query, category]);

  return (
    <section className="catalog-explorer">
      <div className="catalog-tools">
        <label className="catalog-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search products</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setLimit(48); }} placeholder="SEARCH NAME, SKU, FLAVOR..." />
        </label>
        <div className="category-row"><SlidersHorizontal aria-hidden="true" />{categories.map((item) => (
          <button key={item} className={item === category ? "active" : ""} onClick={() => { setCategory(item); setLimit(48); }}>{item}</button>
        ))}</div>
      </div>
      <div className="catalog-count"><span>{String(shown.length).padStart(2, "0")} products</span><b>{category}</b></div>
      <div className="catalog-grid">{shown.slice(0, limit).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      {shown.length > limit && <div className="load-more"><Button size="lg" onClick={() => setLimit((value) => value + 48)}>Load more products</Button></div>}
      {!shown.length && <div className="empty-signal"><b>NO SIGNAL.</b><p>Try another category or clear the search.</p></div>}
    </section>
  );
}
