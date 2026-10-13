"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCart } from "@/components/storefront/cart-provider";
import type { PromoProduct } from "@/lib/promo";
import type { StoreProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function PromoAddToBag({ product }: { product: StoreProduct }) {
  const { add, busy } = useCart();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const available = product.stock > 0 && Boolean(product.variantId);

  async function addToBag() {
    setPending(true);
    setMessage("");
    try {
      await add(product);
      setMessage("Added to your bag.");
    } catch {
      setMessage("Couldn’t add this item. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="promo-buy-control">
      <button type="button" className="promo-buy-button" disabled={!available || busy || pending} onClick={addToBag}>
        <Plus aria-hidden="true" />{pending ? "ADDING…" : available ? "ADD TO BAG" : "UNAVAILABLE"}
      </button>
      <p className="promo-buy-status" role="status">{message}</p>
    </div>
  );
}

export function ProductSpotlight({ product, selection, children, triggerClassName }: {
  product?: StoreProduct;
  selection: PromoProduct;
  children: ReactNode;
  triggerClassName?: string;
}) {
  const name = product?.name ?? selection.label;
  const image = product?.image ?? selection.imageUrl;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName} aria-label={`Quick view: ${name}`}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="promo-spotlight">
        <div className="promo-spotlight-image">
          {/* Campaign media may be published from external HTTPS locations. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={name} width={600} height={600} />
        </div>
        <div className="promo-spotlight-copy">
          <span className="promo-kicker">UP N SMOKE / THE CLOSE-UP</span>
          <DialogTitle className="promo-spotlight-title">{name}</DialogTitle>
          <DialogDescription className="promo-spotlight-description">
            {product ? product.description : "Explore the full menu for current prices and availability."}
          </DialogDescription>
          {product ? (
            <>
              <div className="promo-spotlight-details">
                <strong>{formatMoney(product.price)}</strong>
                <span>{product.stock > 0 ? `${product.stock} in store` : "Currently out of stock"}</span>
              </div>
              <PromoAddToBag product={product} />
              <Link className="promo-detail-link" href={`/product/${product.handle}`}>FULL PRODUCT DETAILS <ArrowUpRight aria-hidden="true" /></Link>
            </>
          ) : (
            <Link className="promo-detail-link" href="/menu">EXPLORE THE MENU <ArrowUpRight aria-hidden="true" /></Link>
          )}
          <small>21+ / VALID ID REQUIRED AT PICKUP</small>
        </div>
      </DialogContent>
    </Dialog>
  );
}
