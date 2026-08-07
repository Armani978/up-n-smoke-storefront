import { describe, expect, it } from "vitest";
import { hasPermission, roleForEmail } from "./roles";

describe("employee permissions", () => {
  it("grants stock writes to managers but not employees", () => {
    expect(hasPermission("manager", "inventory.write")).toBe(true);
    expect(hasPermission("employee", "inventory.write")).toBe(false);
  });

  it("keeps settings restricted to administrators", () => {
    expect(hasPermission("admin", "settings.write")).toBe(true);
    expect(hasPermission("manager", "settings.write")).toBe(false);
  });

  it("maps the seeded Medusa administrator safely by default", () => {
    expect(roleForEmail("ADMIN@UPNSMOKE.LOCAL")).toBe("admin");
    expect(roleForEmail("counter@upnsmoke.local")).toBe("employee");
  });
});
