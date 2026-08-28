import "server-only";

import { MEDUSA_BACKEND_URL, storeHeaders } from "@/lib/medusa/config";
import type { CustomerSession } from "@/lib/auth/session";

async function customerFetch<T>(session: CustomerSession, path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
      ...init,
      headers: storeHeaders({ Authorization: `Bearer ${session.token}`, ...(init?.headers ?? {}) }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export type CustomerProfile = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  addresses?: Array<{
    id: string;
    address_name?: string;
    first_name?: string;
    last_name?: string;
    address_1?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    phone?: string;
  }>;
};

export async function getCustomerProfile(session: CustomerSession) {
  const result = await customerFetch<{ customer: CustomerProfile }>(session, "/store/customers/me?fields=*addresses");
  return result?.customer ?? null;
}

export async function getCustomerOrders(session: CustomerSession) {
  const result = await customerFetch<{ orders: Array<Record<string, unknown>> }>(session, "/store/orders?limit=50&fields=*items,*shipping_address");
  return result?.orders ?? [];
}

export async function addCustomerAddress(session: CustomerSession, input: Record<string, string>) {
  return customerFetch<{ customer: CustomerProfile }>(session, "/store/customers/me/addresses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Preserves the response status (unlike customerFetch, which collapses any
// non-OK response to null) so callers can distinguish "not found / not
// yours" (404 — Medusa scopes every address lookup to the authenticated
// customer's own id, so this is also how a cross-customer edit/delete
// attempt is rejected) from a genuine upstream failure.
async function customerMutate<T>(session: CustomerSession, path: string, init: RequestInit) {
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
      ...init,
      headers: storeHeaders({ Authorization: `Bearer ${session.token}`, ...(init.headers ?? {}) }),
      cache: "no-store",
    });
    const body = await response.json().catch(() => null) as T | null;
    return { status: response.status, body };
  } catch {
    return { status: 0, body: null as T | null };
  }
}

// Medusa's Store API uses POST for these updates, not PATCH — confirmed
// against the actual route handlers (medusa-backend/node_modules/@medusajs/
// medusa/dist/api/store/customers/me/route.js and .../addresses/[address_id]
// /route.js), not assumed from REST convention.
export function updateCustomerProfile(session: CustomerSession, input: Record<string, string>) {
  return customerMutate<{ customer: CustomerProfile }>(session, "/store/customers/me", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCustomerAddress(session: CustomerSession, addressId: string, input: Record<string, string>) {
  return customerMutate<{ customer: CustomerProfile }>(session, `/store/customers/me/addresses/${addressId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteCustomerAddress(session: CustomerSession, addressId: string) {
  return customerMutate<{ id: string; deleted: boolean }>(session, `/store/customers/me/addresses/${addressId}`, {
    method: "DELETE",
  });
}
