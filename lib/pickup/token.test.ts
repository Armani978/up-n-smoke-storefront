import { describe, expect, it } from "vitest";
import { createPickupToken, hashPickupToken } from "../../medusa-backend/src/modules/pickup-verification/token";

describe("pickup QR tokens", () => {
  it("creates unique opaque tokens and stores a one-way hash", () => {
    const first = createPickupToken();
    const second = createPickupToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashPickupToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPickupToken(first)).not.toContain(first);
  });
});
