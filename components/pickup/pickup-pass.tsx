"use client";

import { IdCard, MapPin, PackageCheck } from "lucide-react";
import type { PickupPassData, PickupVerificationData } from "@/lib/types";

export function PickupPass({ pass }: { pass: PickupPassData }) {
  const ready = pass.order.status === "ready" || pass.order.status === "arrived";
  return <section className="pickup-pass" aria-label={`Pickup pass for order ${pass.order.displayId}`}>
    <header><span>UP N SMOKE</span><b>{ready ? "READY FOR PICKUP" : "PICKUP RESERVED"}</b></header>
    <div className="pickup-code" aria-label={`Pickup code ${pass.token}`}><span>YOUR PICKUP CODE</span><strong>{pass.token}</strong><small>Show this code at the counter</small></div>
    <div className="pickup-pass-order"><span>ORDER #{pass.order.displayId}</span><strong>{pass.order.customerName}</strong><small><MapPin /> {pass.order.pickupLocation}</small><b data-status={pass.order.status}>{pass.order.status}</b></div>
    <p><IdCard /> Show this six-digit code and a valid government-issued photo ID to an employee.</p>
    {pass.requiresAgeVerification && <div className="pickup-id-required"><b>21+</b><span>MUST BE 21+ WITH VALID ID</span></div>}
  </section>;
}

export function PickupCompleted({ pickup }: { pickup: PickupVerificationData }) {
  return <section className="pickup-completed"><PackageCheck /><span>UP N SMOKE</span><h2>PICKED UP</h2><p>Order #{pickup.order.displayId}</p>{pickup.completedAt && <small>Picked up {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(pickup.completedAt))}</small>}</section>;
}
