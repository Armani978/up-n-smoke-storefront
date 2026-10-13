import type { NextConfig } from "next";

const serverMedusaUrl = (
  process.env.MEDUSA_BACKEND_URL ??
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
  process.env.VITE_MEDUSA_BACKEND_URL ??
  "http://127.0.0.1:9000"
).replace(/\/$/, "");

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
