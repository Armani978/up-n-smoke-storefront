import { ProductCard } from "@/components/storefront/product-card";
import { FallHero } from "@/components/storefront/fall-hero";
import { FallMarquee } from "@/components/storefront/fall-marquee";
import { FallBenefits } from "@/components/storefront/fall-benefits";
import { FallLeafFrame } from "@/components/storefront/fall-leaf-frame";
import { HeroRotator } from "@/components/storefront/hero-rotator";
import { PromoProducts } from "@/components/storefront/promo-products";
import { PromoSlide } from "@/components/storefront/promo-slide";
import { getCatalog } from "@/lib/medusa/catalog";
import { getStorefrontPromos } from "@/lib/promo";
import { getStorefrontSeason } from "@/lib/season";

export default async function HomePage() {
  const [products, promos] = await Promise.all([getCatalog(), getStorefrontPromos()]);
  const featured = products.slice(0, 4);

  return (
    <main className="fall-home">
      <HeroRotator labels={["Fall After Dark", ...promos.map((promo) => promo.campaignName)]}>
        <FallHero season={getStorefrontSeason()} />
        {promos.map((promo) => <PromoSlide key={promo.key} promo={promo} />)}
      </HeroRotator>
      <FallMarquee />
      <FallBenefits />
      <PromoProducts promos={promos} catalog={products} />

      <section id="featured" className="featured-drop">
        <FallLeafFrame />
        <div className="section-heading">
          <div><span className="eyebrow">Fresh picks / local pickup</span><h2>LATEST<br /><em>DROP.</em></h2></div>
          <p>Shop by the exact device and flavor: puff rating, nicotine level, price, and local quantity are visible before you reserve.</p>
        </div>
        <div className="featured-grid">
          {featured.map((product, index) => <ProductCard key={product.id} product={product} featured={index === 0} />)}
        </div>
      </section>

      <section className="pickup-manifesto">
        <div className="manifesto-number">03</div>
        <div><span className="eyebrow">The no-wait ritual</span><h2>CLICK.<br />ROLL IN.<br /><em>ROLL OUT.</em></h2></div>
        <ol>
          <li><b>01</b><span>Browse the menu</span></li>
          <li><b>02</b><span>Reserve your pickup</span></li>
          <li><b>03</b><span>Show ID at the counter</span></li>
        </ol>
      </section>
    </main>
  );
}
