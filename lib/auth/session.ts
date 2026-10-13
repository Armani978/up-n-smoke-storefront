import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { EmployeeSession } from "@/lib/types";
import { EMPLOYEE_COOKIE, LEGACY_EMPLOYEE_COOKIE } from "@/lib/auth/constants";
import { hasPermission, roleForEmail, type Permission } from "@/lib/auth/roles";
import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";

const CUSTOMER_COOKIE = "uns_customer_session";
const TWELVE_HOURS = 60 * 60 * 12;
const TWO_WEEKS = 60 * 60 * 24 * 14;

export type CustomerSession = { email: string; token: string; expiresAt: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error("AUTH_SECRET must be at least 32 characters in production.");
  }
  return value || "local-development-secret-change-before-launch";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encode<T>(payload: T) {
  const value = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${value}.${sign(value)}`;
}

function decode<T>(signed: string | undefined): T | null {
  if (!signed) return null;
  const [value, signature] = signed.split(".");
  if (!value || !signature) return null;
  const expected = sign(value);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function valid<T extends { expiresAt: number }>(session: T | null): T | null {
  return session && session.expiresAt > Date.now() ? session : null;
}

export async function setEmployeeSession(session: Omit<EmployeeSession, "expiresAt">) {
  const store = await cookies();
  store.set(EMPLOYEE_COOKIE, encode({ ...session, expiresAt: Date.now() + TWELVE_HOURS * 1000 }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWELVE_HOURS,
    priority: "high",
  });
}

export async function setCustomerSession(session: Omit<CustomerSession, "expiresAt">) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, encode({ ...session, expiresAt: Date.now() + TWO_WEEKS * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWO_WEEKS,
  });
}

export const getEmployeeSession = cache(async () => {
  const session = valid(decode<EmployeeSession>((await cookies()).get(EMPLOYEE_COOKIE)?.value));
  if (!session) return null;
  const role = roleForEmail(session.email);
  if (!role) return null;
  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/users/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { user?: { email?: string } };
    if (payload.user?.email?.toLowerCase() !== session.email.toLowerCase()) return null;
    return { ...session, role };
  } catch {
    return null;
  }
});

export async function getCustomerSession() {
  return valid(decode<CustomerSession>((await cookies()).get(CUSTOMER_COOKIE)?.value));
}

export async function requireEmployee(permission?: Permission) {
  const session = await getEmployeeSession();
  if (!session) redirect("/employee/login");
  if (permission && !hasPermission(session.role, permission)) redirect("/employee/dashboard?denied=1");
  return session;
}

export async function employeeApiAccess(permission?: Permission) {
  const session = await getEmployeeSession();
  if (!session) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) } as const;
  if (permission && !hasPermission(session.role, permission)) {
    return { response: NextResponse.json({ error: "You do not have permission for this action." }, { status: 403 }) } as const;
  }
  return { session } as const;
}

export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session) redirect("/login");
  return session;
}

export async function clearSessions() {
  const store = await cookies();
  store.delete(EMPLOYEE_COOKIE);
  if (LEGACY_EMPLOYEE_COOKIE !== EMPLOYEE_COOKIE) store.delete(LEGACY_EMPLOYEE_COOKIE);
  store.delete(CUSTOMER_COOKIE);
}
