import { createHash, randomBytes, randomInt } from "node:crypto"

export function createPickupToken() {
  return randomBytes(32).toString("base64url")
}

export function createPickupCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

export function hashPickupToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex")
}
