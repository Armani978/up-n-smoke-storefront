"use client";

import { Check, Clock3, Mail, PackageCheck, Phone, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { OrderDetails } from "@/components/employee/order-details";
import type { AdminOrder, PickupStatus } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { DataFreshness } from "@/components/employee/data-freshness";

const next: Partial<Record<PickupStatus, PickupStatus>> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
};
const label: Partial<Record<PickupStatus, string>> = {
  pending: "Accept",
  accepted: "Start prep",
  preparing: "Mark ready",
};

export function PickupQueue({
  initialOrders,
  initialUpdatedAt,
  timeZone,
}: {
  initialOrders: AdminOrder[];
  initialUpdatedAt: string;
  timeZone: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"active" | "completed" | "all">(
    "active",
  );
  const [message, setMessage] = useState("");
  const visible = useMemo(
    () =>
      orders.filter(
        (order) =>
          filter === "all" ||
          (filter === "completed"
            ? ["completed", "cancelled"].includes(order.pickupStatus)
            : !["completed", "cancelled"].includes(order.pickupStatus)),
      ),
    [orders, filter],
  );
  async function update(order: AdminOrder, pickupStatus: PickupStatus) {
    const response = await fetch(`/api/employee/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickupStatus }),
    });
    if (response.ok) {
      setOrders((items) =>
        items.map((item) =>
          item.id === order.id ? { ...item, pickupStatus } : item,
        ),
      );
      setMessage(`Order #${order.displayId} is ${pickupStatus}.`);
    } else setMessage("Medusa could not update this order.");
  }
  async function refresh() {
    const response = await fetch("/api/employee/orders", { cache: "no-store" });
    if (!response.ok) {
      setMessage("Medusa could not refresh the pickup queue.");
      return false;
    }
    setOrders((await response.json()).orders);
    return true;
  }
  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <span>Medusa orders / pickup lifecycle</span>
          <h1>
            PICKUP
            <br />
            <em>QUEUE.</em>
          </h1>
        </div>
        <div className="ops-heading-actions">
          <DataFreshness initialUpdatedAt={initialUpdatedAt} timeZone={timeZone} onRefresh={refresh} />
          <div className="queue-count">
            <PackageCheck />
            <b>
              {
                orders.filter(
                  (order) =>
                    !["completed", "cancelled"].includes(order.pickupStatus),
                ).length
              }
            </b>
            <span>active</span>
          </div>
        </div>
      </header>
      <div className="ops-tabs">
        {(["active", "completed", "all"] as const).map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {message && (
        <p className="ops-message">
          {message}
          <button onClick={() => setMessage("")}>
            <X />
          </button>
        </p>
      )}
      <section className="pickup-grid">
        {visible.map((order) => (
          <article key={order.id}>
            <header>
              <div>
                <span>ORDER</span>
                <h2>#{order.displayId}</h2>
              </div>
              <em data-status={order.pickupStatus}>{order.pickupStatus}</em>
            </header>
            <div className="pickup-customer">
              <b>{order.customerName}</b>
              {order.phone && (
                <a href={`tel:${order.phone}`}>
                  <Phone /> {order.phone}
                </a>
              )}
              <a href={`mailto:${order.email}`}>
                <Mail /> {order.email}
              </a>
            </div>
            <OrderDetails order={order} />
            <dl>
              <div>
                <dt>
                  <Clock3 /> Window
                </dt>
                <dd>{order.pickupWindow}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatMoney(order.total, order.currency)}</dd>
              </div>
            </dl>
            <footer>
              {next[order.pickupStatus] && (
                <Button
                  size="sm"
                  onClick={() => void update(order, next[order.pickupStatus]!)}
                >
                  <Check /> {label[order.pickupStatus]}
                </Button>
              )}
              {["ready", "arrived"].includes(order.pickupStatus) && (
                <Button asChild size="sm">
                  <Link href="/employee/pickups/scan">Verify pickup</Link>
                </Button>
              )}
              {!["completed", "cancelled"].includes(order.pickupStatus) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void update(order, "cancelled")}
                >
                  Cancel
                </Button>
              )}
            </footer>
          </article>
        ))}
      </section>
      {!visible.length && (
        <p className="ops-empty large">No orders match this queue.</p>
      )}
    </div>
  );
}
