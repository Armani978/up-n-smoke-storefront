"use client";

import { IdCard, MapPin, PackageCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { PickupAlreadyIssuedData, PickupPassData, PickupVerificationData } from "@/lib/types";

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

export function PickupAlreadyIssued({ pickup, orderId, email }: { pickup: PickupAlreadyIssuedData; orderId: string; email: string }) {
  const [pass, setPass] = useState<PickupPassData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function regenerate() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/pickup-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, email, regenerate: true }),
      });
      const payload = await response.json().catch(() => null) as (PickupPassData & { error?: string }) | null;
      if (!response.ok || !payload) throw new Error(payload?.error || "Unable to issue a new pickup code.");
      setPass(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to issue a new pickup code.");
    } finally {
      setBusy(false);
    }
  }

  if (pass) return <PickupPass pass={pass} />;

  return <section className="pickup-pass-issued" aria-label={`Pickup pass for order ${pickup.order.displayId}`}>
    <header><span>UP N SMOKE</span><b>PICKUP RESERVED</b></header>
    <div className="pickup-pass-order"><ShieldCheck /><span>ORDER #{pickup.order.displayId}</span><strong>{pickup.order.customerName}</strong><small><MapPin /> {pickup.order.pickupLocation}</small></div>
    <p>A pickup code was already sent to you for this order — check your confirmation screen or email. Requesting a new one below will invalidate that code.</p>
    {error && <p role="alert">{error}</p>}
    <button type="button" onClick={() => void regenerate()} disabled={busy}><RefreshCw /> {busy ? "Issuing…" : "Get a new pickup code"}</button>
  </section>;
}

export function PickupCompleted({ pickup }: { pickup: PickupVerificationData }) {
  return <section className="pickup-completed"><PackageCheck /><span>UP N SMOKE</span><h2>PICKED UP</h2><p>Order #{pickup.order.displayId}</p>{pickup.completedAt && <small>Picked up {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(pickup.completedAt))}</small>}</section>;
}
