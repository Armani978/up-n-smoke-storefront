import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { StorefrontPromo } from "@/lib/promo";
import { getCatalog } from "@/lib/medusa/catalog";
import { ProductSpotlight } from "@/components/storefront/product-spotlight";

function safeHref(href: string) {
  return href.startsWith("/") || href.startsWith("https://") ? href : "/menu";
}

export async function PromoSlide({ promo, headingLevel = "h2" }: { promo: StorefrontPromo; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const catalog = await getCatalog();
  const selections = promo.products.map((selection) => ({ selection, product: catalog.find((product) => product.handle === selection.handle) }));
  const first = selections[0];
  const media = <>
    {/* Staff may publish HTTPS campaign media that is not known at build time. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={promo.heroImageUrl} alt={`${promo.campaignName} campaign`} width={1000} height={1000} />
    <span className="promo-media-hint">EXPLORE THE DROP <ArrowUpRight aria-hidden="true" /></span>
  </>;

  return (
    <section className="promo-hero">
      <div className="promo-copy">
        <span className="promo-kicker">{promo.campaignName}</span>
        <Heading>{promo.headline}</Heading>
        <p>{promo.supportingCopy}</p>
        <Link href={safeHref(promo.ctaHref)} className="promo-primary-action">
          {promo.ctaLabel}<ArrowUpRight aria-hidden="true" />
        </Link>
        <small>21+ / VALID ID REQUIRED AT PICKUP</small>
      </div>
      <div className="promo-hero-media">
        {first ? <ProductSpotlight {...first} triggerClassName="promo-media-open">{media}</ProductSpotlight> : media}
        {selections.length > 1 ? <div className="promo-slide-selections">{selections.map(({ selection, product }, index) => <ProductSpotlight key={`${selection.handle}-${index}`} selection={selection} product={product} triggerClassName="promo-slide-selection"><span>{selection.label}</span><ArrowUpRight aria-hidden="true" /></ProductSpotlight>)}</div> : null}
      </div>
    </section>
  );
}
