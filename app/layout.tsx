import type { Metadata } from "next";
import { Archivo, Barlow_Condensed } from "next/font/google";
import { StoreProviders } from "@/components/storefront/providers";
import { getCatalog } from "@/lib/medusa/catalog";
import "./globals.css";
import "./promo.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const body = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "UP N SMOKE — Reserve. Roll in. Pick up.", template: "%s | UP N SMOKE" },
  description: "Shop live local inventory and reserve your order for fast in-store pickup in Manchester, New Hampshire.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "UP N SMOKE",
    description: "Premium smoke and vapor essentials, ready for pickup.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <StoreProviders catalog={catalog}>{children}</StoreProviders>
      </body>
    </html>
  );
}
