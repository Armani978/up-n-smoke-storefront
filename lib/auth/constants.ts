export const EMPLOYEE_COOKIE = process.env.NODE_ENV === "production"
  ? "__Host-uns_employee_session"
  : "uns_employee_session";

export const LEGACY_EMPLOYEE_COOKIE = "uns_employee_session";
