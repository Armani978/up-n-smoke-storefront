import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { adminFetch } from "@/lib/medusa/admin";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const access = await employeeApiAccess("products.write");
  if ("response" in access) return access.response;
  const { session } = access;
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if ("name" in body) update.title = String(body.name ?? "").trim();
  if ("description" in body) update.description = String(body.description ?? "");
  if ("image" in body) {
    const thumbnail = String(body.image ?? "").trim();
    const localMediaUrl = process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):9000\/static\//i.test(thumbnail);
    if (thumbnail && !(/^(https:\/\/|\/(?!\/))/i.test(thumbnail) || localMediaUrl)) {
      return NextResponse.json({ error: "Product photo must be an HTTPS URL or a local /product-images path." }, { status: 400 });
    }
    update.thumbnail = thumbnail || null;
  }
  if (body.imageSource) {
    const current = await adminFetch<{ product?: { metadata?: Record<string, unknown> } }>(session, `/admin/products/${id}?fields=metadata`);
    update.metadata = {
      ...(current?.product?.metadata ?? {}),
      photo_source: String(body.imageSource).slice(0, 120),
      photo_source_url: String(body.imageSourceUrl ?? "").slice(0, 500) || null,
    };
  }
  const requestedStatus = "storefront" in body
    ? (body.storefront ? "published" : "draft")
    : ("status" in body ? String(body.status) : undefined);
  if (requestedStatus && !["published", "draft"].includes(requestedStatus)) {
    return NextResponse.json({ error: "Product status must be published or draft." }, { status: 400 });
  }
  if (requestedStatus) update.status = requestedStatus;
  if (requestedStatus === "published") {
    const [channels, current] = await Promise.all([
      adminFetch<{ sales_channels: Array<{ id: string; name: string }> }>(session, "/admin/sales-channels?limit=100"),
      adminFetch<{ product: { sales_channels?: Array<{ id: string }> } }>(session, `/admin/products/${id}?fields=*sales_channels`),
    ]);
    const channel = channels?.sales_channels?.find((item) => /up n smoke|online pickup/i.test(item.name)) ?? channels?.sales_channels?.[0];
    if (!channel) return NextResponse.json({ error: "Medusa storefront sales channel is missing." }, { status: 409 });
    const channelIds = current?.product.sales_channels?.map((item) => item.id) ?? [];
    update.sales_channels = [...new Set([...channelIds, channel.id])].map((channelId) => ({ id: channelId }));
  }
  const result = await adminFetch(session, `/admin/products/${id}`, {
    method: "POST",
    body: JSON.stringify(update),
  });
  if (!result) return NextResponse.json({ error: "Unable to update product." }, { status: 502 });
  revalidateTag("catalog", "max");
  return NextResponse.json(result);
}

export async function DELETE(_: Request, { params }: Context) {
  const access = await employeeApiAccess("products.write");
  if ("response" in access) return access.response;
  const { session } = access;
  const { id } = await params;
  const result = await adminFetch(session, `/admin/products/${id}`, { method: "POST", body: JSON.stringify({ status: "draft" }) });
  if (!result) return NextResponse.json({ error: "Unable to archive product." }, { status: 502 });
  revalidateTag("catalog", "max");
  return NextResponse.json({ ok: true });
}
