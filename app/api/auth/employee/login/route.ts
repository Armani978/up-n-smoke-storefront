import { NextResponse, type NextRequest } from "next/server";
import { roleForEmail } from "@/lib/auth/roles";
import { setEmployeeSession } from "@/lib/auth/session";
import { redirectUrl } from "@/lib/http/redirect-url";
import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const role = roleForEmail(email);
  if (!role) {
    return NextResponse.redirect(redirectUrl("/employee/login?error=Staff+access+is+not+enabled+for+this+account.", request), 303);
  }
  const response = await fetch(`${MEDUSA_BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const payload = (await response.json()) as { token?: string; message?: string };
  if (!response.ok || !payload.token) {
    return NextResponse.redirect(redirectUrl(`/employee/login?error=${encodeURIComponent(payload.message ?? "Invalid employee credentials.")}`, request), 303);
  }
  await setEmployeeSession({ email, token: payload.token, role });
  return NextResponse.redirect(redirectUrl("/employee/dashboard", request), 303);
}
