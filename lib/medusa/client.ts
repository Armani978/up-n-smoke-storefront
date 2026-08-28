type MedusaClient = InstanceType<typeof import("@medusajs/js-sdk").default>;
let client: MedusaClient | null = null;

// The SDK requires an absolute URL. A same-origin proxy path like "/medusa"
// (the production default, so the browser never talks cross-origin to
// Medusa directly) isn't one on its own; resolve it against the page's own
// origin. Exported (and origin passed explicitly) so this is unit-testable
// without mocking `window`.
export function resolveMedusaBaseUrl(configured: string, origin?: string) {
  if (configured.startsWith("/") && origin) {
    return new URL(configured, origin).toString();
  }
  return configured;
}

export async function getMedusaClient() {
  if (!client) {
    const { default: Medusa } = await import("@medusajs/js-sdk");
    const configured = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    client = new Medusa({
      baseUrl: resolveMedusaBaseUrl(configured, origin),
      publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
      debug: process.env.NODE_ENV === "development",
      auth: { type: "jwt" },
    });
  }
  return client;
}
