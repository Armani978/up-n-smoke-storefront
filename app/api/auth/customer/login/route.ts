import { NextResponse, type NextRequest } from "next/server";
import { setCustomerSession } from "@/lib/auth/session";
import { redirectUrl } from "@/lib/http/redirect-url";
import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/customer/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const payload = (await response.json()) as { token?: string; message?: string };
  if (!response.ok || !payload.token) {
    return NextResponse.redirect(redirectUrl(`/login?error=${encodeURIComponent(payload.message ?? "Invalid email or password.")}`, request), 303);
  }
  await setCustomerSession({ email, token: payload.token });
  return NextResponse.redirect(redirectUrl("/account", request), 303);
}
