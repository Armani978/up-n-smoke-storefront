import { NextResponse, type NextRequest } from "next/server";
import { setCustomerSession } from "@/lib/auth/session";
import { redirectUrl } from "@/lib/http/redirect-url";
import { MEDUSA_BACKEND_URL, storeHeaders } from "@/lib/medusa/config";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const firstName = String(data.get("firstName") ?? "").trim();
  const lastName = String(data.get("lastName") ?? "").trim();
  const authResponse = await fetch(`${MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const auth = (await authResponse.json()) as { token?: string; message?: string };
  if (!authResponse.ok || !auth.token) {
    return NextResponse.redirect(redirectUrl(`/login?mode=register&error=${encodeURIComponent(auth.message ?? "Unable to create account.")}`, request), 303);
  }
  const customerResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/customers`, {
    method: "POST",
    headers: storeHeaders({ Authorization: `Bearer ${auth.token}` }),
    body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
    cache: "no-store",
  });
  if (!customerResponse.ok) {
    const failure = (await customerResponse.json()) as { message?: string };
    return NextResponse.redirect(redirectUrl(`/login?mode=register&error=${encodeURIComponent(failure.message ?? "Unable to create customer profile.")}`, request), 303);
  }
  // The token from /auth/customer/emailpass/register was minted before the
  // customer record existed, so its actor_id is permanently empty — Medusa
  // links the customer to the auth identity as a side effect of the
  // /store/customers call above, but a JWT already issued doesn't retroactively
  // pick that up. Any customer-scoped write (profile/address update or delete)
  // that resolves the customer id from req.auth_context.actor_id would silently
  // 401 for the lifetime of that session. Re-authenticate to get a fresh token
  // with the real actor_id, the same one a subsequent login would produce.
  const freshAuth = await fetch(`${MEDUSA_BACKEND_URL}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const fresh = (await freshAuth.json()) as { token?: string };
  await setCustomerSession({ email, token: fresh.token ?? auth.token });
  return NextResponse.redirect(redirectUrl("/account", request), 303);
}
