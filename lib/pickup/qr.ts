// Shared between the QR encoder (components/pickup/pickup-qr.tsx) and the
// employee scanner's decoder (components/employee/pickup-scanner.tsx) so the
// two can never drift out of sync on payload shape. The payload is always
// the same 6-digit code shown as plain text on the pickup pass and typed at
// the counter for manual entry — never an opaque token.
export function pickupQrPayload(code: string) {
  return `UNS-PICKUP:1:${code}`;
}

export function parsePickupQrPayload(text: string): string | null {
  const match = /^UNS-PICKUP:1:(\d{6})$/.exec(text);
  return match ? match[1] : null;
}
