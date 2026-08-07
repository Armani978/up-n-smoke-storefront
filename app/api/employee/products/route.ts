import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { adminFetch, listAdminProducts } from "@/lib/medusa/admin";

export async function GET() {
  const access = await employeeApiAccess("products.read");
  if ("response" in access) return access.response;
  const { session } = access;
  return NextResponse.json({ products: await listAdminProducts(session) });
}

export async function POST(request: Request) {
  const access = await employeeApiAccess("products.write");
  if ("response" in access) return access.response;
  const { session } = access;
  const body = await request.json() as Record<string, unknown>;
  const thumbnail = String(body.image ?? "").trim();
  if (thumbnail && !/^(https:\/\/|\/(?!\/))/i.test(thumbnail)) {
    return NextResponse.json({ error: "Product photo must be an HTTPS URL or a local /product-images path." }, { status: 400 });
  }
  const [profiles, channels] = await Promise.all([
    adminFetch<{ shipping_profiles: Array<{ id: string }> }>(session, "/admin/shipping-profiles?limit=10"),
    adminFetch<{ sales_channels: Array<{ id: string }> }>(session, "/admin/sales-channels?limit=10"),
  ]);
  const profile = profiles?.shipping_profiles?.[0];
  const channel = channels?.sales_channels?.[0];
  if (!profile || !channel) return NextResponse.json({ error: "Medusa shipping profile or sales channel is missing." }, { status: 409 });
  const result = await adminFetch(session, "/admin/products", {
    method: "POST",
    body: JSON.stringify({
      title: body.name,
      description: body.description,
      thumbnail: thumbnail || undefined,
      status: "published",
      shipping_profile_id: profile.id,
      sales_channels: [{ id: channel.id }],
      options: [{ title: "Format", values: ["Standard"] }],
      variants: [{ title: "Standard", sku: body.sku, manage_inventory: true, options: { Format: "Standard" }, prices: [{ currency_code: "usd", amount: Number(body.price ?? 0) }] }],
    }),
  });
  if (!result) return NextResponse.json({ error: "Medusa rejected the product." }, { status: 502 });
  revalidateTag("catalog", "max");
  return NextResponse.json(result, { status: 201 });
}
