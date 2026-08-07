import { AlertTriangle, ArrowUpRight, Boxes, CircleDollarSign, PackageCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminOrders, listAdminProducts } from "@/lib/medusa/admin";
import { formatMoney } from "@/lib/utils";

type Props = { searchParams: Promise<{ denied?: string }> };

export default async function EmployeeDashboard({ searchParams }: Props) {
  const session = await requireEmployee("dashboard.read");
  const query = await searchParams;
  const [products, orders] = await Promise.all([listAdminProducts(session), listAdminOrders(session)]);
  const active = orders.filter((order) => !["completed", "cancelled"].includes(order.pickupStatus));
  const completed = orders.filter((order) => order.pickupStatus === "completed");
  const revenue = completed.reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((product) => product.stock <= 5);
  const stats = [
    { label: "Active pickups", value: active.length, icon: PackageCheck, href: "/employee/pickups" },
    { label: "Catalog products", value: products.length, icon: Boxes, href: "/employee/inventory" },
    { label: "Completed orders", value: completed.length, icon: ShoppingBag, href: "/employee/sales" },
    { label: "Pickup revenue", value: formatMoney(revenue), icon: CircleDollarSign, href: "/employee/sales" },
  ];
  return <div className="ops-page"><header className="ops-heading"><div><span>Live operations / {session.role}</span><h1>SHIFT<br /><em>PULSE.</em></h1></div><p>{new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}<br />Manchester counter</p></header>{query.denied && <p className="ops-alert">Your role does not permit that operation.</p>}<section className="ops-stat-grid">{stats.map(({ label, value, icon: Icon, href }, index) => <Link href={href} key={label} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}><Icon /><span>{label}</span><strong>{value}</strong><ArrowUpRight /></Link>)}</section><div className="ops-dashboard-grid"><section className="ops-panel"><header><div><span>Pickup signal</span><h2>COUNTER QUEUE</h2></div><Link href="/employee/pickups">View all →</Link></header>{active.slice(0, 6).map((order) => <article className="queue-row" key={order.id}><b>#{order.displayId}</b><span>{order.customerName}<small>{order.pickupWindow}</small></span><em data-status={order.pickupStatus}>{order.pickupStatus}</em></article>)}{!active.length && <p className="ops-empty">No active pickups in the queue.</p>}</section><section className="ops-panel"><header><div><span>Inventory signal</span><h2>LOW STOCK</h2></div><Link href="/employee/inventory">Manage →</Link></header>{lowStock.slice(0, 6).map((product) => <article className="stock-row" key={product.id}><AlertTriangle /><span>{product.name}<small>{product.sku}</small></span><b>{product.stock}</b></article>)}{!lowStock.length && <p className="ops-empty">Every live product is above threshold.</p>}</section></div></div>;
}
