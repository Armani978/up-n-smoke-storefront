import { AlertTriangle } from "lucide-react";
import { DashboardRefresh } from "@/components/employee/dashboard-refresh";
import { OrderDetails } from "@/components/employee/order-details";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminOrders } from "@/lib/medusa/admin";
import { formatStoreDate } from "@/lib/store-time";
import { formatMoney } from "@/lib/utils";

export default async function SalesPage() {
  const session = await requireEmployee("orders.read");
  let orders: Awaited<ReturnType<typeof listAdminOrders>> = [];
  let dataError = false;
  try {
    orders = await listAdminOrders(session, true);
  } catch {
    dataError = true;
  }
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <span>Medusa order ledger</span>
          <h1>
            ORDERS &<br />
            <em>SALES.</em>
          </h1>
        </div>
        <div className="sales-total">
          <span>Loaded revenue</span>
          <b>{dataError ? "—" : formatMoney(total)}</b>
        </div>
      </header>
      {dataError && (
        <section className="ops-recovery" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div><h2>MEDUSA SIGNAL LOST.</h2><p>The order ledger could not be loaded. No totals are being shown.</p></div>
          <DashboardRefresh retry auto={false} />
        </section>
      )}
      {!dataError && <section className="ops-data-table orders">
        <header>
          <span>Order</span>
          <span>Customer</span>
          <span>Created</span>
          <span>Pickup</span>
          <span>Total</span>
        </header>
        {orders.map((order) => (
          <details key={order.id} className="order-ledger-row">
            <summary>
              <b>#{order.displayId}</b>
              <span>
                {order.customerName}
                <small>{order.email}</small>
              </span>
              <span>
                {formatStoreDate(order.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
              <em data-status={order.pickupStatus}>{order.pickupStatus}</em>
              <b>
                {formatMoney(order.total, order.currency)}
                <small>View details ↓</small>
              </b>
            </summary>
            <div className="ledger-details">
              <OrderDetails order={order} />
              <p>
                <b>Pickup window</b>
                {order.pickupWindow}
              </p>
              {order.phone && (
                <p>
                  <b>Phone</b>
                  <a href={`tel:${order.phone}`}>{order.phone}</a>
                </p>
              )}
            </div>
          </details>
        ))}
      </section>}
      {!dataError && !orders.length && (
        <p className="ops-empty large">No Medusa orders are available yet.</p>
      )}
    </div>
  );
}
