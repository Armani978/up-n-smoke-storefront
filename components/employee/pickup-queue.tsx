"use client";

import { Check, Clock3, PackageCheck, Phone, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminOrder, PickupStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const next: Partial<Record<PickupStatus, PickupStatus>> = { pending: "accepted", accepted: "preparing", preparing: "ready", ready: "completed", arrived: "completed" };
const label: Partial<Record<PickupStatus, string>> = { pending: "Accept", accepted: "Start prep", preparing: "Mark ready", ready: "Complete", arrived: "Complete" };

export function PickupQueue({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [message, setMessage] = useState("");
  const visible = useMemo(() => orders.filter((order) => filter === "all" || (filter === "completed" ? ["completed", "cancelled"].includes(order.pickupStatus) : !["completed", "cancelled"].includes(order.pickupStatus))), [orders, filter]);
  async function update(order: AdminOrder, pickupStatus: PickupStatus) { const response = await fetch(`/api/employee/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pickupStatus }) }); if (response.ok) { setOrders((items) => items.map((item) => item.id === order.id ? { ...item, pickupStatus } : item)); setMessage(`Order #${order.displayId} is ${pickupStatus}.`); } else setMessage("Medusa could not update this order."); }
  return <div className="ops-page"><header className="ops-heading"><div><span>Medusa orders / pickup lifecycle</span><h1>PICKUP<br /><em>QUEUE.</em></h1></div><div className="queue-count"><PackageCheck /><b>{orders.filter((order) => !["completed", "cancelled"].includes(order.pickupStatus)).length}</b><span>active</span></div></header><div className="ops-tabs">{(["active", "completed", "all"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>{message && <p className="ops-message">{message}<button onClick={() => setMessage("")}><X /></button></p>}<section className="pickup-grid">{visible.map((order) => <article key={order.id}><header><div><span>ORDER</span><h2>#{order.displayId}</h2></div><em data-status={order.pickupStatus}>{order.pickupStatus}</em></header><div className="pickup-customer"><b>{order.customerName}</b><span><Phone /> {order.email}</span></div><dl><div><dt><Clock3 /> Window</dt><dd>{order.pickupWindow}</dd></div><div><dt>Items</dt><dd>{order.itemCount}</dd></div><div><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div></dl><footer>{next[order.pickupStatus] && <Button size="sm" onClick={() => void update(order, next[order.pickupStatus]!)}><Check /> {label[order.pickupStatus]}</Button>}{!["completed", "cancelled"].includes(order.pickupStatus) && <Button size="sm" variant="ghost" onClick={() => void update(order, "cancelled")}>Cancel</Button>}</footer></article>)}</section>{!visible.length && <p className="ops-empty large">No orders match this queue.</p>}</div>;
}
