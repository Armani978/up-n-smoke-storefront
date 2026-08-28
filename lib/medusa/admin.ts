import "server-only";

import type { EmployeeSession } from "@/lib/types";
import type { AdminOrder, AdminProduct, PickupStatus } from "@/lib/types";
import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";
import { resolveProductImage } from "@/lib/product-images";

export async function adminFetch<T>(session: EmployeeSession, path: string, init?: RequestInit, strict = false): Promise<T | null> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}`, ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (!response.ok) {
      if (strict) throw new Error(`Medusa request failed with status ${response.status}.`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    if (strict) throw error;
    return null;
  }
}

type RawProduct = {
  id: string; title: string; handle: string; description?: string; thumbnail?: string; status?: string;
  categories?: Array<{ name: string }>;
  sales_channels?: Array<{ id: string }>;
  variants?: Array<{
    id: string; sku?: string; inventory_quantity?: number;
    prices?: Array<{ amount: number; currency_code: string }>;
    inventory_items?: Array<{ inventory_item_id?: string; inventory?: { id: string; location_levels?: Array<{ id: string; location_id: string; stocked_quantity: number }> } }>;
  }>;
};

export async function listAdminProducts(session: EmployeeSession, strict = false): Promise<AdminProduct[]> {
  const fields = "*variants,+variants.inventory_quantity,*variants.prices,*variants.inventory_items.inventory.location_levels,*categories,*sales_channels,+thumbnail";
  const channels = await adminFetch<{ sales_channels: Array<{ id: string; name: string }> }>(session, "/admin/sales-channels?limit=100", undefined, strict);
  const storefrontChannel = channels?.sales_channels?.find((item) => /up n smoke|online pickup/i.test(item.name)) ?? channels?.sales_channels?.[0];
  const products: RawProduct[] = [];
  let offset = 0;
  let count = 1;
  while (offset < count && offset < 2000) {
    const result = await adminFetch<{ products: RawProduct[]; count?: number }>(session, `/admin/products?limit=100&offset=${offset}&fields=${encodeURIComponent(fields)}`, undefined, strict);
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
    const sku = variant?.sku ?? product.handle;
    return {
      id: product.id,
      variantId: variant?.id ?? "",
      name: product.title,
      handle: product.handle,
      sku,
      category: product.categories?.[0]?.name ?? "Other",
      description: product.description ?? "",
      image: resolveProductImage(product.thumbnail, sku),
      price: Number(variant?.prices?.find((price) => price.currency_code === "usd")?.amount ?? 0),
      stock: Number(level?.stocked_quantity ?? variant?.inventory_quantity ?? 0),
      accent: index % 2 ? "#ffd84a" : "#f4ff35",
      signals: [],
      status: product.status ?? "published",
      onStorefront: product.status === "published" && (storefrontChannel
        ? Boolean(product.sales_channels?.some((channel) => channel.id === storefrontChannel.id))
        : Boolean(product.sales_channels?.length)),
      inventoryItemId: inventory?.id ?? variant?.inventory_items?.[0]?.inventory_item_id,
      inventoryLevelId: level?.id,
      inventoryLocationId: level?.location_id,
    };
  });
}

export async function listAdminOrders(session: EmployeeSession, strict = false): Promise<AdminOrder[]> {
  const fields = "*items,*items.variant,*items.product,*customer,*shipping_address";
  const result = await adminFetch<{ orders: Array<Record<string, unknown>> }>(session, `/admin/orders?limit=100&fields=${encodeURIComponent(fields)}`, undefined, strict);
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

export async function listAdminCustomers(session: EmployeeSession, strict = false) {
  const result = await adminFetch<{ customers: Array<Record<string, unknown>> }>(session, "/admin/customers?limit=100&fields=*orders", undefined, strict);
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
