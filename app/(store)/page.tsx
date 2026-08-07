import { ArrowDownRight, ArrowUpRight, Clock3, MapPin, ScanLine } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { getCatalog } from "@/lib/medusa/catalog";

export default async function HomePage() {
  const products = await getCatalog();
  const featured = products.slice(0, 4);

  return (
    <main>
      <section className="home-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-kicker"><span>01</span> Manchester’s pickup counter</div>
        <h1><span>PICK</span><br /><em>YOUR</em><br /><span>POISON.</span></h1>
        <p className="hero-copy">Live shelf inventory. No shipping maze. Reserve your lineup and collect it at the counter while it’s still hot.</p>
        <Link href="/menu" className="hero-cta">Shop what’s live <ArrowUpRight /></Link>
        <div className="hero-orbit orbit-one">15<small>min</small></div>
        <div className="hero-orbit orbit-two">ID<small>ready</small></div>
        <div className="hero-stamp"><ScanLine /><span>LOCAL STOCK<br />UPDATED LIVE</span></div>
        <a href="#featured" className="hero-scroll"><ArrowDownRight /> Scroll for the drop</a>
      </section>

      <section className="ticker" aria-label="Store benefits">
        <div>LIVE INVENTORY ✦ PICKUP ONLY ✦ PAY AT THE COUNTER ✦ MANCHESTER NH ✦ LIVE INVENTORY ✦ PICKUP ONLY ✦ PAY AT THE COUNTER ✦</div>
      </section>

      <section className="proof-strip">
        <article><Clock3 /><span>Fast lane</span><strong>15–20 min</strong></article>
        <article><MapPin /><span>Your counter</span><strong>655 S Willow</strong></article>
        <article><ScanLine /><span>Stock signal</span><strong>Medusa live</strong></article>
      </section>

      <section id="featured" className="featured-drop">
        <div className="section-heading">
          <div><span className="eyebrow">Fresh on the shelf / 01—04</span><h2>THE CURRENT<br /><em>SIGNAL.</em></h2></div>
          <p>Product-first cards inspired by in-store flavor boards: quick specs, loud color, and nothing hidden.</p>
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
