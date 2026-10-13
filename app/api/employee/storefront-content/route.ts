import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { employeeApiAccess } from "@/lib/auth/session"
import { adminFetch } from "@/lib/medusa/admin"
import { DEFAULT_STOREFRONT_CONTENT, normalizeStorefrontContent } from "@/lib/storefront-content"

export async function GET() {
  const access = await employeeApiAccess("content.write")
  if ("response" in access) return access.response
  const result = await adminFetch<{ content?: unknown }>(access.session, "/admin/storefront-content")
  return NextResponse.json({ content: result?.content ? normalizeStorefrontContent(result.content) : DEFAULT_STOREFRONT_CONTENT })
}

export async function POST(request: Request) {
  const access = await employeeApiAccess("content.write")
  if ("response" in access) return access.response
  const result = await adminFetch<{ content?: unknown }>(access.session, "/admin/storefront-content", { method: "POST", body: JSON.stringify(await request.json()) })
  if (!result?.content) return NextResponse.json({ error: "The page content could not be saved. Check the Medusa connection and try again." }, { status: 502 })
  revalidateTag("storefront-content", "max")
  return NextResponse.json({ content: normalizeStorefrontContent(result.content) })
}
