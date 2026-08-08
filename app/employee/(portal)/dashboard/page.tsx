import { AlertTriangle, ArrowUpRight, Boxes, CircleDollarSign, PackageCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { DashboardRefresh } from "@/components/employee/dashboard-refresh";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminOrders, listAdminProducts } from "@/lib/medusa/admin";
import { STORE_TIMEZONE } from "@/lib/store-time";
import { formatMoney } from "@/lib/utils";

type Props = { searchParams: Promise<{ denied?: string }> };

export default async function EmployeeDashboard({ searchParams }: Props) {
  const session = await requireEmployee("dashboard.read");
  const query = await searchParams;
  let products: Awaited<ReturnType<typeof listAdminProducts>> = [];
  let orders: Awaited<ReturnType<typeof listAdminOrders>> = [];
  let dataError = false;

  try {
    [products, orders] = await Promise.all([
      listAdminProducts(session, true),
      listAdminOrders(session, true),
    ]);
  } catch {
    dataError = true;
  }

  const active = orders.filter((order) => !["completed", "cancelled"].includes(order.pickupStatus));
  const completed = orders.filter((order) => order.pickupStatus === "completed");
  const revenue = completed.reduce((sum, order) => sum + order.total, 0);
  const lowStock = products
    .filter((product) => product.status === "published" && product.stock <= 5)
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));
  const stats = [
    { label: "Active pickups", context: "Latest 100 orders", value: active.length, icon: PackageCheck, href: "/employee/pickups" },
    { label: "Catalog products", context: "Loaded catalog", value: products.length, icon: Boxes, href: "/employee/inventory" },
    { label: "Completed orders", context: "Latest 100 orders", value: completed.length, icon: ShoppingBag, href: "/employee/sales" },
    { label: "Pickup revenue", context: "Completed · latest 100", value: formatMoney(revenue), icon: CircleDollarSign, href: "/employee/sales" },
  ];
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: STORE_TIMEZONE }).format(now);
  const updatedAt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: STORE_TIMEZONE }).format(now);

  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <span>Operations snapshot / {session.role}</span>
          <h1>SHIFT<br /><em>PULSE.</em></h1>
        </div>
        <div className="ops-heading-meta">
          <p>{date}<br />Manchester counter · updated {updatedAt}</p>
          <DashboardRefresh retry={dataError} />
        </div>
      </header>

      {query.denied && <p className="ops-alert" role="alert">Your role does not permit that operation.</p>}
      {dataError && (
        <section className="ops-recovery" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div><h2>MEDUSA SIGNAL LOST.</h2><p>Live orders and inventory could not be loaded. No operational totals are being shown.</p></div>
          <DashboardRefresh retry auto={false} />
        </section>
      )}

      <section className="ops-stat-grid" aria-label="Store operations summary">
        {stats.map(({ label, context, value, icon: Icon, href }) => (
          <Link href={href} key={label} aria-label={`${label}: ${dataError ? "unavailable" : value}. ${context}`}>
            <Icon aria-hidden="true" />
            <ArrowUpRight aria-hidden="true" />
            <span>{label}<small>{context}</small></span>
            <strong>{dataError ? "—" : value}</strong>
          </Link>
        ))}
      </section>

      <div className="ops-dashboard-grid">
        <section className="ops-panel">
          <header><div><span>Pickup signal</span><h2>COUNTER QUEUE</h2></div><Link href="/employee/pickups">View all <ArrowUpRight aria-hidden="true" /></Link></header>
          {dataError ? <p className="ops-empty">Queue unavailable until Medusa reconnects.</p> : active.slice(0, 6).map((order) => <article className="queue-row" key={order.id}><b>#{order.displayId}</b><span>{order.customerName}<small>{order.pickupWindow}</small></span><em data-status={order.pickupStatus}>{order.pickupStatus}</em></article>)}
          {!dataError && !active.length && <p className="ops-empty">No active pickups in the latest 100 orders.</p>}
        </section>
        <section className="ops-panel">
          <header><div><span>Inventory signal</span><h2>LOW STOCK</h2></div><Link href="/employee/inventory">Manage <ArrowUpRight aria-hidden="true" /></Link></header>
          {dataError ? <p className="ops-empty">Inventory unavailable until Medusa reconnects.</p> : lowStock.slice(0, 6).map((product) => <article className="stock-row" key={product.id}><AlertTriangle aria-hidden="true" /><span>{product.name}<small>{product.sku}</small></span><b>{product.stock}</b></article>)}
          {!dataError && !lowStock.length && <p className="ops-empty">Every published product is above the five-unit threshold.</p>}
        </section>
      </div>
    </div>
  );
}
