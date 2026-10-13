"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/storefront/cart-provider";
import type { StoreProduct } from "@/lib/types";

export function ProductBuyPanel({ product }: { product: StoreProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const { add, busy } = useCart();
  const available = product.stock > 0 && Boolean(product.variantId);

  const submit = async () => {
    try {
      await add(product, quantity);
      setMessage("Added to pickup bag");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add product");
    }
  };

  return (
    <div className="buy-panel">
      <div className="quantity-control">
        <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus /></button>
        <b>{quantity}</b>
        <button onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} aria-label="Increase quantity"><Plus /></button>
      </div>
      <Button size="lg" onClick={submit} disabled={!available || busy}>{available ? "Add for pickup" : "Currently unavailable"}</Button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
