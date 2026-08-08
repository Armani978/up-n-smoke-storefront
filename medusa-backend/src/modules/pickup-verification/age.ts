export type CalendarDate = { year: number; month: number; day: number }

export const STORE_TIMEZONE = process.env.STORE_TIMEZONE || "America/New_York"

export function localDateAt(instant = new Date(), timeZone = STORE_TIMEZONE): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(instant)
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value("year"), month: value("month"), day: value("day") }
}

export function parseDateOnly(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const result = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  const probe = new Date(Date.UTC(result.year, result.month - 1, result.day))
  if (probe.getUTCFullYear() !== result.year || probe.getUTCMonth() !== result.month - 1 || probe.getUTCDate() !== result.day) return null
  return result
}

function compare(a: CalendarDate, b: CalendarDate) {
  return a.year - b.year || a.month - b.month || a.day - b.day
}

export function getTwentyOneCutoffDate(reference: CalendarDate): CalendarDate {
  const year = reference.year - 21
  const lastDay = new Date(Date.UTC(year, reference.month, 0)).getUTCDate()
  return { year, month: reference.month, day: Math.min(reference.day, lastDay) }
}

export function getAge(dateOfBirth: CalendarDate, reference: CalendarDate): number {
  let age = reference.year - dateOfBirth.year
  const birthdayThisYear = {
    year: reference.year,
    month: dateOfBirth.month,
    day: dateOfBirth.month === 2 && dateOfBirth.day === 29
      ? new Date(Date.UTC(reference.year, 2, 0)).getUTCDate()
      : dateOfBirth.day,
  }
  if (compare(reference, birthdayThisYear) < 0) age--
  return age
}

export function isAtLeast21(dateOfBirth: CalendarDate, reference: CalendarDate) {
  return getAge(dateOfBirth, reference) >= 21
}

export function toIsoDate(value: CalendarDate) {
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`
}
