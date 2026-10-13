import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStorefrontSeason } from "./season";

describe("storefront season", () => {
  beforeEach(() => {
    vi.stubEnv("STOREFRONT_SEASON", undefined);
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_SEASON", undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to Halloween when no campaign is configured", () => {
    expect(getStorefrontSeason()).toBe("halloween");
  });

  it.each(["halloween", "harvest"] as const)("uses the public %s fallback", (season) => {
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_SEASON", season);
    expect(getStorefrontSeason()).toBe(season);
  });

  it.each(["halloween", "harvest"] as const)("prefers the server %s campaign over the public fallback", (season) => {
    vi.stubEnv("STOREFRONT_SEASON", season);
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_SEASON", season === "harvest" ? "halloween" : "harvest");
    expect(getStorefrontSeason()).toBe(season);
  });

  it("falls back to Halloween for an unsupported campaign", () => {
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_SEASON", "winter");
    expect(getStorefrontSeason()).toBe("halloween");
  });

  it("uses the default for an unsupported server campaign even when the public fallback is valid", () => {
    vi.stubEnv("STOREFRONT_SEASON", "winter");
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_SEASON", "harvest");
    expect(getStorefrontSeason()).toBe("halloween");
  });
});
