import type { AdminOrder } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function OrderDetails({ order }: { order: AdminOrder }) {
  return <div className="order-details"><header><b>ORDER DETAILS</b><span>{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span></header><div className="order-item-list">{order.lineItems.map((line) => <div key={line.id}><strong>{line.quantity}×</strong><span><b>{line.title}</b><small>{[line.variantTitle && line.variantTitle !== "Standard" ? line.variantTitle : "", line.sku ? `SKU ${line.sku}` : ""].filter(Boolean).join(" · ") || "Standard item"}</small></span><em>{formatMoney(line.total, order.currency)}</em></div>)}</div>{!order.lineItems.length && <p>No line-item details were returned by Medusa.</p>}{order.pickupNotes && <p className="order-notes"><b>Customer note</b>{order.pickupNotes}</p>}</div>;
}
