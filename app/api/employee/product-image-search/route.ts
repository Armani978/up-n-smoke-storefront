import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { findProductImages } from "@/lib/media/product-image-search";

export async function POST(request: Request) {
  const access = await employeeApiAccess("products.write");
  if ("response" in access) return access.response;
  const { productId } = await request.json() as { productId?: unknown };
  if (typeof productId !== "string" || !productId.trim()) return NextResponse.json({ error: "A product is required." }, { status: 400 });
  try {
    return NextResponse.json(await findProductImages(access.session, productId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to search for product images." }, { status: 502 });
  }
}
