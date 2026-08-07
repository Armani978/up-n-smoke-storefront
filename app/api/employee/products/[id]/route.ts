import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/auth/session";
import { adminFetch } from "@/lib/medusa/admin";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const session = await requireEmployee("products.write");
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const thumbnail = String(body.image ?? "").trim();
  if (thumbnail && !/^(https:\/\/|\/(?!\/))/i.test(thumbnail)) {
    return NextResponse.json({ error: "Product photo must be an HTTPS URL or a local /product-images path." }, { status: 400 });
  }
  const result = await adminFetch(session, `/admin/products/${id}`, {
    method: "POST",
    body: JSON.stringify({ title: body.name, description: body.description, status: body.status, thumbnail: thumbnail || null }),
  });
  if (!result) return NextResponse.json({ error: "Unable to update product." }, { status: 502 });
  revalidateTag("catalog", "max");
  return NextResponse.json(result);
}

export async function DELETE(_: Request, { params }: Context) {
  const session = await requireEmployee("products.write");
  const { id } = await params;
  const result = await adminFetch(session, `/admin/products/${id}`, { method: "POST", body: JSON.stringify({ status: "draft" }) });
  if (!result) return NextResponse.json({ error: "Unable to archive product." }, { status: 502 });
  revalidateTag("catalog", "max");
  return NextResponse.json({ ok: true });
}
