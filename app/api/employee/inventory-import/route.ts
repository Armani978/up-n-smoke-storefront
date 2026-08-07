import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/auth/session";
import { adminFetch } from "@/lib/medusa/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireEmployee("inventory.write");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) return NextResponse.json({ message: "Select an XLSX workbook." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ message: "Workbook must be smaller than 10 MB." }, { status: 413 });
  const fileBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const result = await adminFetch<Record<string, unknown>>(session, "/admin/inventory-import", {
    method: "POST",
    body: JSON.stringify({ file_base64: fileBase64, dry_run: form.get("dryRun") !== "false" }),
  });
  return result ? NextResponse.json(result) : NextResponse.json({ message: "Medusa could not process this workbook." }, { status: 502 });
}
