"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMedusaClient } from "@/lib/medusa/client";
import type { CartLine, StoreProduct } from "@/lib/types";

const CART_KEY = "uns-medusa-cart-id";

type PickupDetails = {
  name: string;
  email: string;
  phone: string;
  pickupWindow: string;
  notes: string;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  busy: boolean;
  /** True once the server-backed cart has been loaded (or attempted) at
   * least once. Callers that redirect on an empty cart must wait for this
   * before deciding — otherwise a fresh page load's still-empty initial
   * state looks indistinguishable from a genuinely empty cart. */
  ready: boolean;
  add: (product: StoreProduct, quantity?: number) => Promise<void>;
  update: (lineId: string, quantity: number) => Promise<void>;
  completePickup: (details: PickupDetails) => Promise<{ id: string; displayId: string }>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, catalog }: { children: React.ReactNode; catalog: StoreProduct[] }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const mapCart = useCallback(
    (cart: Record<string, unknown>) => {
      const items = (cart.items ?? []) as Array<Record<string, unknown>>;
      const byVariant = new Map(catalog.map((product) => [product.variantId, product]));
      setLines(
        items.flatMap((item) => {
          const product = byVariant.get(String(item.variant_id));
          if (!product) return [];
          return [{
            id: String(item.id),
            variantId: product.variantId,
            productId: product.id,
            title: product.name,
            image: product.image,
            price: product.price,
            quantity: Number(item.quantity),
          }];
        }),
      );
    },
    [catalog],
  );

  const getOrCreateCart = useCallback(async () => {
    const medusa = await getMedusaClient();
    const stored = window.localStorage.getItem(CART_KEY);
    if (stored) {
      try {
        const result = await medusa.store.cart.retrieve(stored, { fields: "*items,*items.variant,*items.product" });
        return result.cart;
      } catch {
        window.localStorage.removeItem(CART_KEY);
      }
    }
    const { regions } = await medusa.store.region.list({ limit: 20 });
    const region = regions.find((item: { currency_code?: string }) => item.currency_code === "usd") ?? regions[0];
    if (!region) throw new Error("The pickup region is not configured.");
    const { cart } = await medusa.store.cart.create({ region_id: region.id });
    window.localStorage.setItem(CART_KEY, cart.id);
    return cart;
  }, []);

  const refresh = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
      setReady(true);
      return;
    }
    try {
      mapCart((await getOrCreateCart()) as unknown as Record<string, unknown>);
    } catch {
      setLines([]);
    } finally {
      setReady(true);
    }
  }, [getOrCreateCart, mapCart]);

  // A fresh page load (full navigation, new tab) mounts a new CartProvider
  // with empty in-memory state; without loading the server-backed cart here,
  // every reload looks like an empty cart even when items were persisted.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh()'s setState calls run after its internal awaits (cart retrieval/creation), not synchronously; this is the standard mount-time data-load pattern the rule's static analysis can't distinguish from a synchronous call.
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = useCallback(
    async (product: StoreProduct, quantity = 1) => {
      if (!product.variantId || product.stock < 1) throw new Error("This product is not available for pickup.");
      setBusy(true);
      try {
        const cart = await getOrCreateCart();
        const medusa = await getMedusaClient();
        const result = await medusa.store.cart.createLineItem(cart.id, {
          variant_id: product.variantId,
          quantity,
        }, { fields: "*items,*items.variant,*items.product" });
        mapCart(result.cart as unknown as Record<string, unknown>);
      } finally {
        setBusy(false);
      }
    },
    [getOrCreateCart, mapCart],
  );

  const update = useCallback(
    async (lineId: string, quantity: number) => {
      setBusy(true);
      try {
        const cart = await getOrCreateCart();
        const medusa = await getMedusaClient();
        if (quantity < 1) {
          const result = await medusa.store.cart.deleteLineItem(cart.id, lineId, { fields: "*items,*items.variant,*items.product" });
          mapCart(result.parent as unknown as Record<string, unknown>);
        } else {
          const result = await medusa.store.cart.updateLineItem(cart.id, lineId, { quantity }, { fields: "*items,*items.variant,*items.product" });
          mapCart(result.cart as unknown as Record<string, unknown>);
        }
      } finally {
        setBusy(false);
      }
    },
    [getOrCreateCart, mapCart],
  );

  const completePickup = useCallback(async (details: PickupDetails) => {
    setBusy(true);
    try {
      const medusa = await getMedusaClient();
      let cart = await getOrCreateCart();
      const [firstName, ...lastParts] = details.name.trim().split(/\s+/);
      const address = {
        first_name: firstName,
        last_name: lastParts.join(" ") || "-",
        phone: details.phone,
        address_1: "655 S Willow St Unit 115A",
        city: "Manchester",
        province: "NH",
        postal_code: "03103",
        country_code: "us",
      };
      cart = (await medusa.store.cart.update(cart.id, {
        email: details.email,
        shipping_address: address,
        billing_address: address,
        metadata: { pickup_window: details.pickupWindow, pickup_notes: details.notes, pickup_status: "pending" },
      })).cart;
      const { shipping_options: options } = await medusa.store.fulfillment.listCartOptions({ cart_id: cart.id });
      const pickup = options.find((option: { type?: { code?: string } }) => option.type?.code === "store-pickup") ?? options[0];
      if (!pickup) throw new Error("No in-store pickup option is configured.");
      cart = (await medusa.store.cart.addShippingMethod(cart.id, { option_id: pickup.id })).cart;
      await medusa.store.payment.initiatePaymentSession(cart, { provider_id: "pp_system_default" });
      const result = await medusa.store.cart.complete(cart.id);
      if (result.type !== "order") throw new Error(result.error?.message ?? "Medusa could not place the pickup order.");
      window.localStorage.removeItem(CART_KEY);
      setLines([]);
      return { id: result.order.id, displayId: String(result.order.display_id ?? result.order.id) };
    } finally {
      setBusy(false);
    }
  }, [getOrCreateCart]);

  const value = useMemo(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    busy,
    ready,
    add,
    update,
    completePickup,
    refresh,
  }), [lines, busy, ready, add, update, completePickup, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
