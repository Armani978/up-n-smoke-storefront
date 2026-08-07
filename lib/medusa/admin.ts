import "server-only";

import type { EmployeeSession } from "@/lib/types";
import type { AdminOrder, AdminProduct, PickupStatus } from "@/lib/types";
import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";

export async function adminFetch<T>(session: EmployeeSession, path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}`, ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type RawProduct = {
  id: string; title: string; handle: string; description?: string; thumbnail?: string; status?: string;
  categories?: Array<{ name: string }>;
  variants?: Array<{
    id: string; sku?: string; inventory_quantity?: number;
    prices?: Array<{ amount: number; currency_code: string }>;
    inventory_items?: Array<{ inventory_item_id?: string; inventory?: { id: string; location_levels?: Array<{ id: string; stocked_quantity: number }> } }>;
  }>;
};

export async function listAdminProducts(session: EmployeeSession): Promise<AdminProduct[]> {
  const fields = "*variants,+variants.inventory_quantity,*variants.prices,*variants.inventory_items.inventory.location_levels,*categories,+thumbnail";
  const products: RawProduct[] = [];
  let offset = 0;
  let count = 1;
  while (offset < count && offset < 2000) {
    const result = await adminFetch<{ products: RawProduct[]; count?: number }>(session, `/admin/products?limit=100&offset=${offset}&fields=${encodeURIComponent(fields)}`);
    if (!result) break;
    products.push(...result.products);
    count = result.count ?? products.length;
    offset += result.products.length;
    if (!result.products.length) break;
  }
  return products.map((product, index) => {
    const variant = product.variants?.[0];
    const inventory = variant?.inventory_items?.[0]?.inventory;
    const level = inventory?.location_levels?.[0];
    return {
      id: product.id,
      variantId: variant?.id ?? "",
      name: product.title,
      handle: product.handle,
      sku: variant?.sku ?? product.handle,
      category: product.categories?.[0]?.name ?? "Other",
      description: product.description ?? "",
      image: product.thumbnail ?? "https://placehold.co/600x700/f4ff35/10110d?text=UNS",
      price: Number(variant?.prices?.find((price) => price.currency_code === "usd")?.amount ?? 0),
      stock: Number(level?.stocked_quantity ?? variant?.inventory_quantity ?? 0),
      accent: index % 2 ? "#ffd84a" : "#f4ff35",
      signals: [],
      status: product.status ?? "published",
      inventoryItemId: inventory?.id ?? variant?.inventory_items?.[0]?.inventory_item_id,
      inventoryLevelId: level?.id,
    };
  });
}

export async function listAdminOrders(session: EmployeeSession): Promise<AdminOrder[]> {
  const fields = "*items,*items.variant,*items.product,*customer,*shipping_address";
  const result = await adminFetch<{ orders: Array<Record<string, unknown>> }>(session, `/admin/orders?limit=100&fields=${encodeURIComponent(fields)}`);
  return (result?.orders ?? []).map((order) => {
    const customer = (order.customer ?? {}) as Record<string, unknown>;
    const shipping = (order.shipping_address ?? {}) as Record<string, unknown>;
    const metadata = (order.metadata ?? {}) as Record<string, unknown>;
    const items = (order.items ?? []) as Array<Record<string, unknown>>;
    const lineItems = items.map((item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unit_price ?? 0);
      return {
        id: String(item.id),
        title: String(item.product_title ?? item.title ?? "Untitled item"),
        variantTitle: String(item.variant_title ?? item.subtitle ?? ""),
        sku: String(item.variant_sku ?? ""),
        quantity,
        unitPrice,
        total: Number(item.total ?? unitPrice * quantity),
      };
    });
    const pickupStatus = String(metadata.pickup_status ?? "pending") as PickupStatus;
    return {
      id: String(order.id),
      displayId: String(order.display_id ?? order.id),
      email: String(order.email ?? "Guest"),
      customerName: [customer.first_name ?? shipping.first_name, customer.last_name ?? shipping.last_name].filter(Boolean).join(" ") || "Guest pickup",
      phone: String(shipping.phone ?? customer.phone ?? ""),
      createdAt: String(order.created_at ?? new Date().toISOString()),
      total: Number(order.total ?? 0),
      currency: String(order.currency_code ?? "USD"),
      itemCount: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      lineItems,
      pickupWindow: String(metadata.pickup_window ?? "ASAP"),
      pickupNotes: String(metadata.pickup_notes ?? ""),
      pickupStatus,
    };
  });
}

export async function listAdminCustomers(session: EmployeeSession) {
  const result = await adminFetch<{ customers: Array<Record<string, unknown>> }>(session, "/admin/customers?limit=100&fields=*orders");
  return result?.customers ?? [];
}

export async function medusaHealthy() {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch {
    return false;
  }
}
