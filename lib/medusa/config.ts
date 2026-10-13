export const MEDUSA_BACKEND_URL = (
  process.env.MEDUSA_BACKEND_URL ??
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
  "http://localhost:9000"
).replace(/\/$/, "");

export const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

export const isMedusaConfigured = Boolean(MEDUSA_PUBLISHABLE_KEY);

export function storeHeaders(extra?: HeadersInit) {
  return {
    "Content-Type": "application/json",
    ...(MEDUSA_PUBLISHABLE_KEY
      ? { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY }
      : {}),
    ...extra,
  };
}
