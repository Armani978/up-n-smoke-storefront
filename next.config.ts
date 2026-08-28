import type { NextConfig } from "next";

// Same guard as lib/medusa/config.ts's resolveServerMedusaUrl, applied here
// too since this value becomes the /medusa rewrite's actual destination —
// a bad value here breaks every proxied Store API call the browser makes.
function resolveServerMedusaUrl() {
  const configured =
    process.env.MEDUSA_BACKEND_URL ??
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
    process.env.VITE_MEDUSA_BACKEND_URL;
  if (process.env.NODE_ENV === "production") {
    if (!configured) {
      throw new Error("MEDUSA_BACKEND_URL must be set in production.");
    }
    if (!/^https?:\/\//i.test(configured)) {
      throw new Error("MEDUSA_BACKEND_URL must be an absolute http(s) URL in production (a relative path is not resolvable server-side).");
    }
    // See lib/medusa/config.ts's identical guard for why this is an
    // explicit opt-out rather than skipped for local builds outright.
    const localhostConfigured = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configured);
    if (localhostConfigured && process.env.ALLOW_LOCALHOST_MEDUSA_URL !== "true") {
      throw new Error("MEDUSA_BACKEND_URL must not point at localhost/127.0.0.1 in production. Set ALLOW_LOCALHOST_MEDUSA_URL=true only for a local production-mode test build.");
    }
    return configured.replace(/\/$/, "");
  }
  return (configured ?? "http://127.0.0.1:9000").replace(/\/$/, "");
}

const serverMedusaUrl = resolveServerMedusaUrl();

const nextConfig: NextConfig = {
  output: "standalone",
  agentRules: false,
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL:
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? process.env.VITE_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? process.env.VITE_MEDUSA_PUBLISHABLE_KEY,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "oss.geekbar.com" },
      { protocol: "https", hostname: "www.raz-vape.com" },
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
  async rewrites() {
    return [{ source: "/medusa/:path*", destination: `${serverMedusaUrl}/:path*` }];
  },
};

export default nextConfig;
