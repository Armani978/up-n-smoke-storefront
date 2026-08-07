import { NextResponse, type NextRequest } from "next/server";
import { setCustomerSession } from "@/lib/auth/session";
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
    return NextResponse.redirect(new URL(`/login?mode=register&error=${encodeURIComponent(auth.message ?? "Unable to create account.")}`, request.url), 303);
  }
  const customerResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/customers`, {
    method: "POST",
    headers: storeHeaders({ Authorization: `Bearer ${auth.token}` }),
    body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
    cache: "no-store",
  });
  if (!customerResponse.ok) {
    const failure = (await customerResponse.json()) as { message?: string };
    return NextResponse.redirect(new URL(`/login?mode=register&error=${encodeURIComponent(failure.message ?? "Unable to create customer profile.")}`, request.url), 303);
  }
  await setCustomerSession({ email, token: auth.token });
  return NextResponse.redirect(new URL("/account", request.url), 303);
}
