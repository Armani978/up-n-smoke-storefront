"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StoreProduct } from "@/lib/types";
import type { StorefrontPromo } from "@/lib/promo";

function safeHref(href: string) {
  return href.startsWith("/") || href.startsWith("https://") ? href : "/menu";
}

export function PromoLanding({ promos, catalog }: { promos: StorefrontPromo[]; catalog: StoreProduct[] }) {
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (promos.length < 2) return;
    const rotation = window.setInterval(() => setSelected((current) => (current + 1) % promos.length), 8000);
    return () => window.clearInterval(rotation);
  }, [promos.length]);
  const promo = promos[selected] ?? promos[0];
  if (!promo) return null;
  const productByHandle = new Map(catalog.map((product) => [product.handle, product]));
  const featured = promo.products.flatMap((selection) => {
    const catalogProduct = selection.handle ? productByHandle.get(selection.handle) : undefined;
    return catalogProduct ? [{
      handle: catalogProduct.handle,
      label: catalogProduct.name,
      imageUrl: catalogProduct.image,
      stock: catalogProduct.stock,
    }] : [];
  });

  return (
    <>
      <section className="promo-hero">
        <div className="promo-copy">
          <h1>{promo.headline}</h1>
          <p>{promo.supportingCopy}</p>
          <Link href={safeHref(promo.ctaHref)} className="promo-primary-action">
            {promo.ctaLabel}<ArrowUpRight aria-hidden="true" />
          </Link>
          <small>21+ / VALID ID REQUIRED AT PICKUP</small>
        </div>
        <div className="promo-hero-media">
          {/* Staff may publish HTTPS campaign media that is not known at build time. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={promo.heroImageUrl} alt="Official Geek Bar Pulse X 2 product campaign" />
        </div>
      </section>

      {promos.length > 1 && <div className="promo-rotation" aria-label="Homepage promotions">
        {promos.map((item, index) => <button key={item.key} type="button" className={index === selected ? "active" : ""} onClick={() => setSelected(index)} aria-label={`Show ${item.campaignName}`} aria-current={index === selected ? "true" : undefined}>{index + 1}</button>)}
      </div>}

      {featured.length > 0 && (
        <section className="promo-products" aria-labelledby="promo-products-title">
          <h2 id="promo-products-title">CHOOSE YOUR <em>PULSE.</em></h2>
          <div className="promo-product-rail">
            {featured.map((product, index) => {
              const href = product.handle ? `/product/${product.handle}` : "/menu";
              return (
                <Link href={href} className="promo-product-lane" key={`${product.label}-${index}`}>
                  <div className="promo-product-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl} alt={product.label} />
                  </div>
                  <div>
                    <span>GEEK BAR</span>
                    <h3>{product.label}</h3>
                    <p>{typeof product.stock === "number" ? (product.stock > 0 ? `${product.stock} ready for pickup` : "Check local availability") : "Available in store now"}</p>
                  </div>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
