import { EmployeeShell } from "@/components/employee/employee-shell";
import { requireEmployee } from "@/lib/auth/session";

export default async function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireEmployee();
  return <EmployeeShell email={session.email} role={session.role}>{children}</EmployeeShell>;
}
