type MedusaClient = InstanceType<typeof import("@medusajs/js-sdk").default>;
let client: MedusaClient | null = null;

export async function getMedusaClient() {
  if (!client) {
    const { default: Medusa } = await import("@medusajs/js-sdk");
    client = new Medusa({
      baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000",
      publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "",
      debug: process.env.NODE_ENV === "development",
      auth: { type: "jwt" },
    });
  }
  return client;
}
