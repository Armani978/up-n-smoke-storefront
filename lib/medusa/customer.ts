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
