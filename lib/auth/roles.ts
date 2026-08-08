import type { EmployeeRole } from "@/lib/types";

export type Permission =
  | "dashboard.read"
  | "products.read"
  | "products.write"
  | "inventory.write"
  | "orders.read"
  | "orders.write"
  | "pickup.read"
  | "pickup.verify"
  | "pickup.complete"
  | "pickup.override"
  | "customers.read"
  | "employees.manage"
  | "settings.write";

const permissions: Record<EmployeeRole, Permission[]> = {
  admin: ["dashboard.read", "products.read", "products.write", "inventory.write", "orders.read", "orders.write", "pickup.read", "pickup.verify", "pickup.complete", "pickup.override", "customers.read", "employees.manage", "settings.write"],
  manager: ["dashboard.read", "products.read", "products.write", "inventory.write", "orders.read", "orders.write", "pickup.read", "pickup.verify", "pickup.complete", "pickup.override", "customers.read"],
  employee: ["dashboard.read", "products.read", "orders.read", "orders.write", "pickup.read", "pickup.verify", "pickup.complete"],
};

export function hasPermission(role: EmployeeRole, permission: Permission) {
  return permissions[role].includes(permission);
}

function emailSet(value: string | undefined) {
  return new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export function roleForEmail(email: string): EmployeeRole | null {
  const normalized = email.toLowerCase();
  const localAdmin = process.env.NODE_ENV === "production" ? "" : "admin@upnsmoke.local";
  const admins = emailSet(process.env.EMPLOYEE_ADMIN_EMAILS ?? localAdmin);
  const managers = emailSet(process.env.EMPLOYEE_MANAGER_EMAILS);
  const staff = emailSet(process.env.EMPLOYEE_STAFF_EMAILS);
  if (admins.has(normalized)) return "admin";
  if (managers.has(normalized)) return "manager";
  if (staff.has(normalized)) return "employee";
  return null;
}
