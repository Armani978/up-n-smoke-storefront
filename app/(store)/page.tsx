import { ArrowDownRight, ArrowUpRight, Clock3, MapPin, ScanLine } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { PromoLanding } from "@/components/storefront/promo-landing";
import { getCatalog } from "@/lib/medusa/catalog";
import { getStorefrontPromos } from "@/lib/promo";
import { getStorefrontContent } from "@/lib/storefront-content";

export default async function HomePage() {
  const [products, promos, content] = await Promise.all([getCatalog(), getStorefrontPromos(), getStorefrontContent()]);
  const featured = products.slice(0, 4);

  return (
    <main>
      {promos.length > 0 ? <PromoLanding promos={promos} catalog={products} /> : <section className="home-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-kicker"><span>01</span> {content.home.kicker}</div>
        <h1><span>{content.home.titleTop}</span><br /><em>{content.home.titleAccent}</em><br /><span>{content.home.titleBottom}</span></h1>
        <Link href="/menu" className="hero-cta">{content.home.ctaLabel} <ArrowUpRight /></Link>
        <div className="hero-orbit orbit-one">15<small>min</small></div>
        <div className="hero-orbit orbit-two">ID<small>ready</small></div>
        <div className="hero-stamp"><ScanLine /><span>GEEK BAR + RAZ<br />LOCAL PICKUP</span></div>
        <a href="#featured" className="hero-scroll"><ArrowDownRight /> See featured flavors</a>
      </section>}

      <section className="ticker" aria-label="Store benefits">
        <div>GEEK BAR ✦ RAZ ✦ LIVE INVENTORY ✦ PICKUP ONLY ✦ 21+ ID REQUIRED ✦ MANCHESTER NH ✦ GEEK BAR ✦ RAZ ✦ LIVE INVENTORY ✦</div>
      </section>

      <section className="proof-strip">
        <article><Clock3 /><span>Fast lane</span><strong>15-20 min</strong></article>
        <article><MapPin /><span>Your counter</span><strong>655 S Willow</strong></article>
        <article><ScanLine /><span>Stock signal</span><strong>Medusa live</strong></article>
      </section>

      <section id="featured" className="featured-drop">
        <div className="section-heading">
          <div><span className="eyebrow">Featured devices / verified product imagery</span><h2>LATEST<br /><em>DROP.</em></h2></div>
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
          <li><b>01</b><span>Browse the live wall</span></li>
          <li><b>02</b><span>Reserve your pickup</span></li>
          <li><b>03</b><span>Show ID at the counter</span></li>
        </ol>
      </section>
    </main>
  );
}
