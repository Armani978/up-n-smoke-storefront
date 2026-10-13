import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { MEDUSA_BACKEND_URL } from "@/lib/medusa/config";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await employeeApiAccess("products.write");
  if ("response" in access) return access.response;
  if (process.env.NODE_ENV === "production" && process.env.PRODUCT_MEDIA_STORAGE_CONFIGURED !== "s3") {
    return NextResponse.json({ error: "Product media storage is not configured. Set S3 storage and PRODUCT_MEDIA_STORAGE_CONFIGURED=s3 before uploading." }, { status: 503 });
  }
  const incoming = await request.formData();
  const image = incoming.get("image");
  if (!(image instanceof File) || !image.type.startsWith("image/") || image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Choose an image smaller than 5 MB." }, { status: 400 });
  }
  const payload = new FormData();
  payload.append("files", image, image.name || "product-photo.jpg");
  const response = await fetch(`${MEDUSA_BACKEND_URL}/admin/uploads`, {
    method: "POST", headers: { Authorization: `Bearer ${access.session.token}` }, body: payload, cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "Medusa could not store this image." }, { status: 502 });
  const { files } = await response.json() as { files?: Array<{ url?: string }> };
  const url = files?.[0]?.url;
  if (!url) return NextResponse.json({ error: "Medusa returned no image URL." }, { status: 502 });
  return NextResponse.json({ url, source: "staff_upload" });
}
