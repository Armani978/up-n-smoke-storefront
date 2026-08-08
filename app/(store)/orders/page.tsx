import { PackageCheck } from "lucide-react";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth/session";
import { getCustomerOrders } from "@/lib/medusa/customer";
import { formatMoney } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await requireCustomer();
  const orders = await getCustomerOrders(session);
  return <main className="orders-page"><header><span className="eyebrow">Customer account</span><h1>ORDER<br /><em>HISTORY.</em></h1></header>{orders.length ? <section className="order-list">{orders.map((order) => { const metadata = (order.metadata ?? {}) as Record<string, string>; return <Link href={`/orders/${String(order.id)}`} key={String(order.id)} className="order-list-link"><article><div><span>#{String(order.display_id ?? order.id)}</span><h2>{metadata.pickup_window || "In-store pickup"}</h2></div><div><span>Status</span><b>{metadata.pickup_status || String(order.status ?? "placed")}</b></div><div><span>Total</span><b>{formatMoney(Number(order.total ?? 0), String(order.currency_code ?? "USD"))}</b></div></article></Link>; })}</section> : <section className="empty-cart"><PackageCheck /><h2>NO PICKUPS YET.</h2><p>Your Medusa order history will appear here.</p></section>}</main>;
}
