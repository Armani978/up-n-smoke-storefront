export type Season = "halloween" | "harvest";

/** A deliberate campaign switch; the season never changes with the clock. */
export function getStorefrontSeason(): Season {
  const raw = process.env.STOREFRONT_SEASON ?? process.env.NEXT_PUBLIC_STOREFRONT_SEASON;
  return raw === "harvest" ? "harvest" : "halloween";
}
