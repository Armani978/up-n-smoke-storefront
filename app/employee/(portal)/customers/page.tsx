import { AlertTriangle } from "lucide-react";
import { DashboardRefresh } from "@/components/employee/dashboard-refresh";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminCustomers } from "@/lib/medusa/admin";
import { formatStoreDate } from "@/lib/store-time";

export default async function CustomersPage() {
  const session = await requireEmployee("customers.read");
  let customers: Awaited<ReturnType<typeof listAdminCustomers>> = [];
  let dataError = false;
  try {
    customers = await listAdminCustomers(session, true);
  } catch {
    dataError = true;
  }
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <span>Medusa customers / protected</span>
          <h1>
            CUSTOMER
            <br />
            <em>INDEX.</em>
          </h1>
        </div>
        <div className="sales-total">
          <span>Customer records</span>
          <b>{dataError ? "—" : customers.length}</b>
        </div>
      </header>
      {dataError && (
        <section className="ops-recovery" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div><h2>MEDUSA SIGNAL LOST.</h2><p>Customer records could not be loaded.</p></div>
          <DashboardRefresh retry auto={false} />
        </section>
      )}
      {!dataError && <section className="ops-data-table customers">
        <header>
          <span>Customer</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Created</span>
          <span>Account</span>
        </header>
        {customers.map((customer) => (
          <article key={String(customer.id)}>
            <b>
              {[customer.first_name, customer.last_name]
                .filter(Boolean)
                .join(" ") || "Unnamed customer"}
            </b>
            <span>{String(customer.email ?? "—")}</span>
            <span>{String(customer.phone ?? "—")}</span>
            <span>
              {customer.created_at ? formatStoreDate(String(customer.created_at), { year: "numeric", month: "short", day: "numeric" }) : "—"}
            </span>
            <em data-status={customer.has_account ? "active" : "guest"}>
              {customer.has_account ? "active" : "guest"}
            </em>
          </article>
        ))}
      </section>}
      {!dataError && !customers.length && (
        <p className="ops-empty large">No customer records are available.</p>
      )}
    </div>
  );
}
