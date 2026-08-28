// The server-side base URL every Server Component/API route fetches Medusa
// through. In production this must be an explicit, resolvable absolute URL:
// falling through to the public var is unsafe because that var is typically
// a same-origin-relative path (e.g. "/medusa", Sprint 02's browser proxy
// fix) which a server-side fetch() cannot resolve the way a browser can,
// and falling through to localhost would silently point at nothing inside
// a real deployment's own container.
function resolveServerMedusaUrl() {
  const configured = process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  if (process.env.NODE_ENV === "production") {
    if (!configured) {
      throw new Error("MEDUSA_BACKEND_URL must be set in production.");
    }
    if (!/^https?:\/\//i.test(configured)) {
      throw new Error("MEDUSA_BACKEND_URL must be an absolute http(s) URL in production (a relative path is not resolvable server-side).");
    }
    // `next build`/`next start` always run with NODE_ENV=production
    // internally (Next.js's own behavior), including for a local
    // production-mode test run against a local Medusa instance -- the same
    // workflow this project's own gates use throughout every sprint. That
    // makes NODE_ENV alone unable to distinguish "genuinely deployed" from
    // "local production-mode build," so the localhost ban is opt-out via an
    // explicit, deliberately-named local-only escape hatch rather than
    // silently disabled -- a real deployment has no reason to ever set it.
    const localhostConfigured = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configured);
    if (localhostConfigured && process.env.ALLOW_LOCALHOST_MEDUSA_URL !== "true") {
      throw new Error("MEDUSA_BACKEND_URL must not point at localhost/127.0.0.1 in production. Set ALLOW_LOCALHOST_MEDUSA_URL=true only for a local production-mode test build.");
    }
    return configured.replace(/\/$/, "");
  }
  return (configured ?? "http://localhost:9000").replace(/\/$/, "");
}

export const MEDUSA_BACKEND_URL = resolveServerMedusaUrl();

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
