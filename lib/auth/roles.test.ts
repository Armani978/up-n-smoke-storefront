import { afterEach, describe, expect, it, vi } from "vitest";
import { hasPermission, roleForEmail } from "./roles";

describe("employee permissions", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("grants stock writes to managers but not employees", () => {
    expect(hasPermission("manager", "inventory.write")).toBe(true);
    expect(hasPermission("employee", "inventory.write")).toBe(false);
  });

  it("keeps settings restricted to administrators", () => {
    expect(hasPermission("admin", "settings.write")).toBe(true);
    expect(hasPermission("manager", "settings.write")).toBe(false);
  });

  it("allows only explicitly approved staff identities", () => {
    expect(roleForEmail("ADMIN@UPNSMOKE.LOCAL")).toBe("admin");
    expect(roleForEmail("counter@upnsmoke.local")).toBeNull();
  });

  it("maps configured manager and staff allowlists", () => {
    vi.stubEnv("EMPLOYEE_MANAGER_EMAILS", "manager@upnsmoke.local");
    vi.stubEnv("EMPLOYEE_STAFF_EMAILS", "counter@upnsmoke.local");
    expect(roleForEmail("manager@upnsmoke.local")).toBe("manager");
    expect(roleForEmail("counter@upnsmoke.local")).toBe("employee");
  });
});
