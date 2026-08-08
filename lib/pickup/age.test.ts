import { describe, expect, it } from "vitest";
import { getAge, getTwentyOneCutoffDate, isAtLeast21, localDateAt, parseDateOnly, toIsoDate } from "../../medusa-backend/src/modules/pickup-verification/age";

const date = (value: string) => {
  const parsed = parseDateOnly(value);
  if (!parsed) throw new Error(`Invalid test date: ${value}`);
  return parsed;
};

describe("pickup age verification", () => {
  const today = date("2026-08-07");

  it("passes someone exactly 21 today", () => {
    expect(getAge(date("2005-08-07"), today)).toBe(21);
    expect(isAtLeast21(date("2005-08-07"), today)).toBe(true);
  });

  it("fails someone who turns 21 tomorrow", () => {
    expect(getAge(date("2005-08-08"), today)).toBe(20);
    expect(isAtLeast21(date("2005-08-08"), today)).toBe(false);
  });

  it("passes someone who turned 21 yesterday", () => {
    expect(getAge(date("2005-08-06"), today)).toBe(21);
    expect(isAtLeast21(date("2005-08-06"), today)).toBe(true);
  });

  it("handles December 31 and January 1 boundaries", () => {
    expect(isAtLeast21(date("2004-12-31"), date("2025-12-31"))).toBe(true);
    expect(isAtLeast21(date("2005-01-01"), date("2025-12-31"))).toBe(false);
    expect(isAtLeast21(date("2005-01-01"), date("2026-01-01"))).toBe(true);
  });

  it("treats February 29 birthdays as February 28 in non-leap years", () => {
    expect(getAge(date("2004-02-29"), date("2025-02-27"))).toBe(20);
    expect(getAge(date("2004-02-29"), date("2025-02-28"))).toBe(21);
    expect(getAge(date("2004-02-29"), date("2024-02-28"))).toBe(19);
    expect(getAge(date("2004-02-29"), date("2024-02-29"))).toBe(20);
  });

  it("clamps a leap-day cutoff to February 28", () => {
    expect(toIsoDate(getTwentyOneCutoffDate(date("2024-02-29")))).toBe("2003-02-28");
  });

  it("uses the configured store timezone across midnight", () => {
    expect(toIsoDate(localDateAt(new Date("2026-08-08T03:59:59Z"), "America/New_York"))).toBe("2026-08-07");
    expect(toIsoDate(localDateAt(new Date("2026-08-08T04:00:00Z"), "America/New_York"))).toBe("2026-08-08");
  });
});
