"use client";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/components/storefront/cart-provider";
import { ProductImage } from "@/components/storefront/product-image";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export default function CartPage() {
  const { lines, subtotal, update, busy } = useCart();
  const tax = 0;

  return (
    <main className="cart-page">
      <header className="page-banner compact"><span className="eyebrow">Reserved for you</span><h1>YOUR<br /><em>BAG.</em></h1></header>
      {!lines.length ? (
        <section className="empty-cart"><ShoppingBag /><h2>THE BAG IS QUIET.</h2><p>Add something live from the wall and it will show up here.</p><Button asChild><Link href="/menu">Shop the live menu</Link></Button></section>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines">
            {lines.map((line) => (
              <article key={line.id}>
                <div className="cart-line-image"><ProductImage src={line.image} alt={line.title} fill sizes="140px" /></div>
                <div className="cart-line-copy"><span>Pickup item</span><h2>{line.title}</h2><strong>{formatMoney(line.price)}</strong></div>
                <div className="quantity-control">
                  <button onClick={() => void update(line.id, line.quantity - 1)} disabled={busy} aria-label="Decrease quantity"><Minus /></button>
                  <b>{line.quantity}</b>
                  <button onClick={() => void update(line.id, line.quantity + 1)} disabled={busy} aria-label="Increase quantity"><Plus /></button>
                </div>
                <button className="remove-line" onClick={() => void update(line.id, 0)} disabled={busy} aria-label={`Remove ${line.title}`}><Trash2 /></button>
              </article>
            ))}
          </section>
          <aside className="cart-summary">
            <span className="eyebrow">Counter total</span>
            <h2>ORDER SIGNAL</h2>
            <dl><div><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div><div><dt>NH sales tax</dt><dd>{formatMoney(tax)}</dd></div><div className="total"><dt>Total</dt><dd>{formatMoney(subtotal + tax)}</dd></div></dl>
            <Button asChild size="lg"><Link href="/checkout">Choose pickup <ArrowRight /></Link></Button>
            <p>Pay at the counter through Clover. Valid ID is required for age-restricted products.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
