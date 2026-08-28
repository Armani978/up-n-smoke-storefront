"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/storefront/cart-provider";
import type { StoreProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function ProductBuyPanel({ product }: { product: StoreProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const { add, busy } = useCart();
  const hasVariantChoice = Boolean(product.variants && product.variants.length > 1);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variantId);
  const selected = hasVariantChoice
    ? product.variants!.find((item) => item.id === selectedVariantId) ?? product.variants![0]
    : { id: product.variantId, price: product.price, stock: product.stock, sku: product.sku, title: "" };
  const available = selected.stock > 0 && Boolean(selected.id);

  const submit = async () => {
    try {
      await add({ ...product, variantId: selected.id, price: selected.price, stock: selected.stock }, quantity);
      setMessage("Added to pickup bag");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add product");
    }
  };

  return (
    <div className="buy-panel">
      <strong className="buy-panel-price">{formatMoney(selected.price)}</strong>
      <p className="buy-panel-stock"><Check /> {selected.stock > 0 ? `${selected.stock} available now` : "Restock in progress"}</p>
      {hasVariantChoice && (
        <div className="variant-control" role="radiogroup" aria-label="Choose an option">
          {product.variants!.map((variant) => (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={variant.id === selected.id}
              className={variant.id === selected.id ? "active" : ""}
              disabled={variant.stock <= 0}
              onClick={() => { setSelectedVariantId(variant.id); setQuantity(1); }}
            >
              {variant.title}{variant.stock <= 0 ? " (out of stock)" : ""}
            </button>
          ))}
        </div>
      )}
      <div className="quantity-control">
        <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus /></button>
        <b>{quantity}</b>
        <button onClick={() => setQuantity((value) => Math.min(selected.stock, value + 1))} aria-label="Increase quantity"><Plus /></button>
      </div>
      <Button size="lg" onClick={submit} disabled={!available || busy}>{available ? "Add for pickup" : "Currently unavailable"}</Button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
