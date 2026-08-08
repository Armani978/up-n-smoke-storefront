"use client";

import { Expand, IdCard, MapPin, PackageCheck } from "lucide-react";
import { PickupQr } from "@/components/pickup/pickup-qr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { PickupPassData, PickupVerificationData } from "@/lib/types";

export function PickupPass({ pass }: { pass: PickupPassData }) {
  const ready = pass.order.status === "ready" || pass.order.status === "arrived";
  return <section className="pickup-pass" aria-label={`Pickup pass for order ${pass.order.displayId}`}>
    <header><span>UP N SMOKE</span><b>{ready ? "READY FOR PICKUP" : "PICKUP RESERVED"}</b></header>
    <PickupQr token={pass.token} />
    <div className="pickup-pass-order"><span>ORDER #{pass.order.displayId}</span><strong>{pass.order.customerName}</strong><small><MapPin /> {pass.order.pickupLocation}</small><b data-status={pass.order.status}>{pass.order.status}</b></div>
    <p><IdCard /> Show this QR code and a valid government-issued photo ID to an employee.</p>
    {pass.requiresAgeVerification && <div className="pickup-id-required"><b>21+</b><span>MUST BE 21+ WITH VALID ID</span></div>}
    <Dialog><DialogTrigger asChild><Button variant="outline" size="lg"><Expand /> Make QR larger</Button></DialogTrigger><DialogContent className="pickup-qr-dialog"><DialogTitle>ORDER #{pass.order.displayId}</DialogTitle><DialogDescription>Hold your screen steady with brightness turned up.</DialogDescription><PickupQr token={pass.token} large /><b>UP N SMOKE · PICKUP PASS</b></DialogContent></Dialog>
  </section>;
}

export function PickupCompleted({ pickup }: { pickup: PickupVerificationData }) {
  return <section className="pickup-completed"><PackageCheck /><span>UP N SMOKE</span><h2>PICKED UP</h2><p>Order #{pickup.order.displayId}</p>{pickup.completedAt && <small>Picked up {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(pickup.completedAt))}</small>}</section>;
}
