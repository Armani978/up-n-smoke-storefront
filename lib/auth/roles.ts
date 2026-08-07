import type { EmployeeRole } from "@/lib/types";

export type Permission =
  | "dashboard.read"
  | "products.read"
  | "products.write"
  | "inventory.write"
  | "orders.read"
  | "orders.write"
  | "customers.read"
  | "employees.manage"
  | "settings.write";

const permissions: Record<EmployeeRole, Permission[]> = {
  admin: ["dashboard.read", "products.read", "products.write", "inventory.write", "orders.read", "orders.write", "customers.read", "employees.manage", "settings.write"],
  manager: ["dashboard.read", "products.read", "products.write", "inventory.write", "orders.read", "orders.write", "customers.read"],
  employee: ["dashboard.read", "products.read", "orders.read", "orders.write"],
};

export function hasPermission(role: EmployeeRole, permission: Permission) {
  return permissions[role].includes(permission);
}

export function roleForEmail(email: string): EmployeeRole {
  const normalized = email.toLowerCase();
  const admins = new Set((process.env.EMPLOYEE_ADMIN_EMAILS ?? "admin@upnsmoke.local").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  const managers = new Set((process.env.EMPLOYEE_MANAGER_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  if (admins.has(normalized)) return "admin";
  if (managers.has(normalized)) return "manager";
  return "employee";
}
