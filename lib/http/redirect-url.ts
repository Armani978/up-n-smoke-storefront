import type { NextRequest } from "next/server";

export function redirectUrl(path: string, request: NextRequest) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return new URL(path, configuredSiteUrl || request.url);
}
