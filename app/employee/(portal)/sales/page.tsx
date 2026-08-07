import { OrderDetails } from "@/components/employee/order-details";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminOrders } from "@/lib/medusa/admin";
import { formatMoney } from "@/lib/utils";

export default async function SalesPage() {
  const session = await requireEmployee("orders.read");
  const orders = await listAdminOrders(session);
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  return <div className="ops-page"><header className="ops-heading"><div><span>Medusa order ledger</span><h1>ORDERS &<br /><em>SALES.</em></h1></div><div className="sales-total"><span>Loaded revenue</span><b>{formatMoney(total)}</b></div></header><section className="ops-data-table orders"><header><span>Order</span><span>Customer</span><span>Created</span><span>Pickup</span><span>Total</span></header>{orders.map((order) => <details key={order.id} className="order-ledger-row"><summary><b>#{order.displayId}</b><span>{order.customerName}<small>{order.email}</small></span><span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(order.createdAt))}</span><em data-status={order.pickupStatus}>{order.pickupStatus}</em><b>{formatMoney(order.total, order.currency)}<small>View details ↓</small></b></summary><div className="ledger-details"><OrderDetails order={order} /><p><b>Pickup window</b>{order.pickupWindow}</p>{order.phone && <p><b>Phone</b><a href={`tel:${order.phone}`}>{order.phone}</a></p>}</div></details>)}</section>{!orders.length && <p className="ops-empty large">No Medusa orders are available yet.</p>}</div>;
}
