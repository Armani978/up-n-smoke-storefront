import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return ["", "/menu", "/login"].map((path) => ({ url: `${site}${path}`, changeFrequency: path === "/menu" ? "daily" : "weekly" }));
}
