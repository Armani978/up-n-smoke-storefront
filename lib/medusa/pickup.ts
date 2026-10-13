import "server-only";

import type { CustomerSession } from "@/lib/auth/session";
import type { EmployeeSession, PickupPassData, PickupVerificationData } from "@/lib/types";
import { MEDUSA_BACKEND_URL, storeHeaders } from "@/lib/medusa/config";

export class MedusaPickupError extends Error {
  constructor(public status: number, public payload: Record<string, unknown>) {
    super(String(payload.message ?? "Pickup verification request failed."));
  }
}

async function request<T>(path: string, init: RequestInit) {
  const response = await fetch(`${MEDUSA_BACKEND_URL}${path}`, { ...init, cache: "no-store" });
  const payload = await response.json().catch(() => ({ message: "Medusa returned an invalid response." })) as Record<string, unknown>;
  if (!response.ok) throw new MedusaPickupError(response.status, payload);
  return payload as T;
}

export function issuePickupPass(orderId: string, email: string, session?: CustomerSession) {
  return request<PickupPassData>("/store/pickup-verifications/issue", {
    method: "POST",
    headers: storeHeaders(session ? { Authorization: `Bearer ${session.token}` } : undefined),
    body: JSON.stringify({ order_id: orderId, email }),
  });
}

export function employeePickupRequest<T = PickupVerificationData>(session: EmployeeSession, path: string, body?: unknown, method = "POST") {
  return request<T>(`/admin/pickup-verifications${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
