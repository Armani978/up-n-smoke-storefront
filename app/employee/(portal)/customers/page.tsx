import { requireEmployee } from "@/lib/auth/session";
import { listAdminCustomers } from "@/lib/medusa/admin";

export default async function CustomersPage() {
  const session = await requireEmployee("customers.read");
  const customers = await listAdminCustomers(session);
  return <div className="ops-page"><header className="ops-heading"><div><span>Medusa customers / protected</span><h1>CUSTOMER<br /><em>INDEX.</em></h1></div><div className="sales-total"><span>Customer records</span><b>{customers.length}</b></div></header><section className="ops-data-table customers"><header><span>Customer</span><span>Email</span><span>Phone</span><span>Created</span><span>Account</span></header>{customers.map((customer) => <article key={String(customer.id)}><b>{[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Unnamed customer"}</b><span>{String(customer.email ?? "—")}</span><span>{String(customer.phone ?? "—")}</span><span>{customer.created_at ? new Date(String(customer.created_at)).toLocaleDateString() : "—"}</span><em data-status={customer.has_account ? "active" : "guest"}>{customer.has_account ? "active" : "guest"}</em></article>)}</section>{!customers.length && <p className="ops-empty large">No customer records are available.</p>}</div>;
}
