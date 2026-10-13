"use client";

import { useEffect, useId, useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ProductSpotlight, PromoAddToBag } from "@/components/storefront/product-spotlight";
import type { StorefrontPromo } from "@/lib/promo";
import type { StoreProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

function headlineLines(headline: string) {
  const words = headline.split(/\s+/);
  const middle = Math.ceil(words.length / 2);
  return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")].filter(Boolean);
}

function CampaignStory({ promo, productByHandle, index }: {
  promo: StorefrontPromo;
  productByHandle: Map<string, StoreProduct>;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  const selections = promo.products.map((selection) => ({ selection, product: productByHandle.get(selection.handle) }));
  const matched = [...new Map(selections.flatMap(({ product }) => product ? [[product.id, product] as const] : [])).values()];
  const stock = matched.reduce((sum, product) => sum + product.stock, 0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Discrete observer updates: no scroll listeners or per-frame React work.
    const observer = new IntersectionObserver(([entry]) => {
      element.classList.toggle("is-inview", entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <article ref={ref} className="promo-story" aria-labelledby={titleId}>
      <div className="promo-story-stage">
        <header className="promo-story-topline">
          <span className="promo-kicker">THE DROP / {String(index + 1).padStart(2, "0")}</span>
          <span className="promo-story-scroll">SCROLL TO DISCOVER <ArrowDown aria-hidden="true" /></span>
        </header>
        <div className="promo-story-scene">
          <div className="promo-story-copy">
            <span className="promo-kicker">{promo.campaignName}</span>
            <h2 id={titleId} className="promo-story-headline">
              {headlineLines(promo.headline).map((line, lineIndex) => <span className="promo-story-line" key={lineIndex}>{line}</span>)}
            </h2>
            <ol className="promo-story-callouts">
              <li><b>01 / THE DROP</b><p>{promo.supportingCopy}</p></li>
              <li><b>02 / THE SELECTION</b><p>{selections.map(({ product, selection }) => product?.name ?? selection.label).join(" / ") || promo.campaignName}</p></li>
              <li><b>03 / LOCAL AVAILABILITY</b><p>{matched.length ? `${stock} units in store across ${matched.length === 1 ? "this featured item" : "these featured items"}. See each selection below.` : "Explore the menu for current prices and availability."}</p></li>
            </ol>
          </div>
          <div className="promo-story-art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={promo.heroImageUrl} alt={`${promo.campaignName} campaign artwork`} width={1000} height={1000} />
            <span className="promo-story-art-caption" aria-hidden="true">UP N SMOKE / AFTER DARK</span>
          </div>
        </div>
        <footer className="promo-story-finish">
          {selections.length ? (
            <div className="promo-story-products">
              {selections.map(({ selection, product }, selectionIndex) => (
                <div className="promo-story-product" key={`${selection.handle}-${selectionIndex}`}>
                  <ProductSpotlight selection={selection} product={product} triggerClassName="promo-story-product-open">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product?.image ?? selection.imageUrl} alt="" width={100} height={100} />
                    <span><b>{product?.name ?? selection.label}</b><span>{product ? `${formatMoney(product.price)} / ${product.stock > 0 ? `${product.stock} IN STORE` : "OUT OF STOCK"}` : "EXPLORE THE DROP"}</span></span>
                    <ArrowUpRight aria-hidden="true" />
                  </ProductSpotlight>
                  {product ? <PromoAddToBag product={product} /> : null}
                </div>
              ))}
            </div>
          ) : <Link className="promo-detail-link" href="/menu">EXPLORE THE MENU <ArrowUpRight aria-hidden="true" /></Link>}
          <p className="promo-story-note">21+ / VALID ID AT PICKUP <span>CLICK A SELECTION FOR THE CLOSE-UP</span></p>
        </footer>
        <div className="promo-story-progress" aria-hidden="true"><span /></div>
      </div>
    </article>
  );
}

export function PromoStory({ promos, catalog }: { promos: StorefrontPromo[]; catalog: StoreProduct[] }) {
  const productByHandle = new Map(catalog.map((product) => [product.handle, product]));
  const active = promos.filter((promo) => promo.active);
  if (!active.length) return null;
  return <section className="promo-stories" aria-label="Explore the current drops">{active.map((promo, index) => <CampaignStory key={promo.key} promo={promo} productByHandle={productByHandle} index={index} />)}</section>;
}
