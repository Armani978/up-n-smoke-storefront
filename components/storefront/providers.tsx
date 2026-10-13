"use client";

import { useEffect } from "react";
import { CartProvider, useCart } from "@/components/storefront/cart-provider";
import type { StoreProduct } from "@/lib/types";

function CartBootstrap() {
  const { refresh } = useCart();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return null;
}

export function StoreProviders({ children, catalog }: { children: React.ReactNode; catalog: StoreProduct[] }) {
  return (
    <CartProvider catalog={catalog}>
      <CartBootstrap />
      {children}
    </CartProvider>
  );
}
