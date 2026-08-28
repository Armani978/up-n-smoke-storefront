import { describe, expect, it } from "vitest";
import { parsePickupQrPayload, pickupQrPayload } from "./qr";

describe("pickup QR payload", () => {
  // Regression coverage for the Sprint 03 defect: the QR encoder and the
  // employee scanner's decoder regex had drifted — the encoder wrapped a
  // 6-digit pickup code, but the scanner required a 40+ character opaque
  // token, so no QR the app could ever generate would pass the scanner's
  // own validation. Sharing one module for both directions makes that class
  // of drift impossible to reintroduce silently.
  it("round-trips a real 6-digit pickup code", () => {
    const payload = pickupQrPayload("293656");
    expect(payload).toBe("UNS-PICKUP:1:293656");
    expect(parsePickupQrPayload(payload)).toBe("293656");
  });

  it("rejects the old opaque-token shape (the exact prior mismatch)", () => {
    const opaqueToken = "a".repeat(43);
    expect(parsePickupQrPayload(`UNS-PICKUP:1:${opaqueToken}`)).toBeNull();
  });

  it("rejects a code that is too short", () => {
    expect(parsePickupQrPayload("UNS-PICKUP:1:1234")).toBeNull();
  });

  it("rejects a code that is too long", () => {
    expect(parsePickupQrPayload("UNS-PICKUP:1:1234567")).toBeNull();
  });

  it("rejects a non-digit code", () => {
    expect(parsePickupQrPayload("UNS-PICKUP:1:12a456")).toBeNull();
  });

  it("rejects the wrong prefix entirely", () => {
    expect(parsePickupQrPayload("SOME-OTHER-QR:293656")).toBeNull();
  });

  it("rejects an empty payload", () => {
    expect(parsePickupQrPayload("")).toBeNull();
  });
});
