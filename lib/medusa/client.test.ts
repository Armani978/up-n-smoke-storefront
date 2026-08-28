import { describe, expect, it } from "vitest";
import { resolveMedusaBaseUrl } from "./client";

describe("resolveMedusaBaseUrl", () => {
  // Regression coverage for the Sprint 02 defect: the Medusa JS SDK requires
  // an absolute baseUrl. Passed the relative same-origin proxy path
  // "/medusa" (the production default, NEXT_PUBLIC_MEDUSA_BACKEND_URL=/medusa
  // in docker-compose.production.yml), the SDK's own URL construction threw
  // "URL constructor: /medusa is not a valid URL" on every store call, so
  // add-to-cart and every other client-side Store API request silently
  // failed with zero network request and zero visible error.
  it("resolves a same-origin relative path against the page origin", () => {
    expect(resolveMedusaBaseUrl("/medusa", "http://localhost:3000")).toBe("http://localhost:3000/medusa");
  });

  it("leaves an already-absolute URL unchanged", () => {
    expect(resolveMedusaBaseUrl("http://localhost:9000", "http://localhost:3000")).toBe("http://localhost:9000");
  });

  it("leaves a relative path unchanged when no origin is available (server-side)", () => {
    expect(resolveMedusaBaseUrl("/medusa")).toBe("/medusa");
  });

  it("resolves against a production-style origin", () => {
    expect(resolveMedusaBaseUrl("/medusa", "https://upnsmokevapors.com")).toBe("https://upnsmokevapors.com/medusa");
  });
});
