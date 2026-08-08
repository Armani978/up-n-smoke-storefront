"use client";

import { ArrowUpRight, Plus, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import type { StoreProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function ProductCard({ product, featured = false }: { product: StoreProduct; featured?: boolean }) {
  const { add, busy } = useCart();
  const [message, setMessage] = useState("");
  const available = product.stock > 0 && Boolean(product.variantId);

  const addProduct = async () => {
    try {
      await add(product);
      setMessage("Added");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unavailable");
    } finally {
      window.setTimeout(() => setMessage(""), 1800);
    }
  };

  return (
    <article className={`signal-card ${featured ? "is-featured" : ""}`} style={{ "--signal": product.accent } as React.CSSProperties}>
      <header className="signal-card-head">
        <div><span>{product.brand ?? product.category}</span><strong>{product.line ?? "Pickup selection"}</strong></div>
        <b className={available ? "is-live" : ""}><i />{available ? `${product.stock} in store` : "Out of stock"}</b>
      </header>
      <Link href={`/product/${product.handle}`} className="signal-image">
        <Image src={product.image} alt={product.name} fill sizes={featured ? "(max-width: 800px) 100vw, 50vw" : "(max-width: 700px) 100vw, 33vw"} />
        <span className="signal-index">{product.sku}</span>
        <span className="signal-view"><Zap /> View flavor</span>
      </Link>
      <div className="signal-info">
        <div>
          <span>{product.brand ?? product.category} / {product.line}</span>
          <h3>{product.flavor ?? product.name}</h3>
          <p>{product.description}</p>
        </div>
        <div className="signal-buy">
          <strong>{formatMoney(product.price)}</strong>
          <button onClick={addProduct} disabled={!available || busy} aria-label={`Add ${product.name} to cart`}>
            {message || (available ? <Plus /> : "Out")}
          </button>
        </div>
      </div>
      <dl className="signal-specs">
        {product.signals.map((signal) => <div key={signal.label}><dt>{signal.label}</dt><dd>{signal.value}</dd></div>)}
      </dl>
      <Link href={`/product/${product.handle}`} className="signal-detail">Details <ArrowUpRight /></Link>
    </article>
  );
}
