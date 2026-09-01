import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { adminFetch } from "@/lib/medusa/admin";
import { DEFAULT_STOREFRONT_PROMO, normalizeStorefrontPromo } from "@/lib/promo";

export async function GET() {
  const access = await employeeApiAccess("promos.write");
  if ("response" in access) return access.response;
  const result = await adminFetch<{ promos?: unknown[] }>(access.session, "/admin/storefront-promo");
  const promos = Array.isArray(result?.promos) ? result.promos.map(normalizeStorefrontPromo) : [DEFAULT_STOREFRONT_PROMO];
  return NextResponse.json({ promos });
}

export async function PUT(request: Request) {
  const access = await employeeApiAccess("promos.write");
  if ("response" in access) return access.response;
  const body = await request.json() as Record<string, unknown>;
  const result = await adminFetch<{ promo?: unknown }>(access.session, "/admin/storefront-promo", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!result?.promo) return NextResponse.json({ error: "The promo could not be saved. Check the Medusa connection and try again." }, { status: 502 });
  revalidateTag("storefront-promo", "max");
  return NextResponse.json({ promo: normalizeStorefrontPromo(result.promo) });
}
