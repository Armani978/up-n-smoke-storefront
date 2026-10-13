export const STORE_TIMEZONE = process.env.STORE_TIMEZONE || "America/New_York";

export function formatStoreDate(value: Date | string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: STORE_TIMEZONE }).format(new Date(value));
}
