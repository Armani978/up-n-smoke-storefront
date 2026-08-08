"use client";

import { CheckCircle2, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { PickupPass } from "@/components/pickup/pickup-pass";
import type { PickupPassData } from "@/lib/types";

const windows = ["ASAP · 15–20 minutes", "Today · 4:30 PM", "Today · 6:00 PM"];

export default function CheckoutPage() {
  const { lines, subtotal, completePickup, busy } = useCart();
  const [complete, setComplete] = useState<{ displayId: string; pickupWindow: string; pass: PickupPassData | null; passError?: string } | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const total = subtotal;

  useEffect(() => {
    if (!lines.length && !complete) router.replace("/cart");
  }, [complete, lines.length, router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const pickupWindow = String(data.get("pickupWindow"));
      const email = String(data.get("email"));
      const result = await completePickup({
        name: String(data.get("name")),
        email,
        phone: String(data.get("phone")),
        pickupWindow,
        notes: String(data.get("notes") ?? ""),
      });
      const passResponse = await fetch("/api/pickup-pass", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: result.id, email }) });
      const pass = await passResponse.json();
      setComplete({ displayId: result.displayId, pickupWindow, pass: passResponse.ok ? pass : null, passError: passResponse.ok ? undefined : pass.error });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to place the pickup order.");
    }
  }

  if (!lines.length && !complete) {
    return null;
  }

  if (complete) {
    return <main className="checkout-complete-shell"><section className="checkout-complete"><CheckCircle2 /><span>ORDER #{complete.displayId}</span><h1>LOCKED<br /><em>IN.</em></h1><p>Your pickup is in the queue for <b>{complete.pickupWindow}</b>. Pay through Clover when you arrive.</p><Button asChild><Link href="/menu">Back to the menu</Link></Button></section>{complete.pass ? <PickupPass pass={complete.pass} /> : <p className="pass-error">Your order was placed, but the pickup pass could not load. {complete.passError || "Open your order history to try again."}</p>}</main>;
  }

  return (
    <main className="checkout-page">
      <header className="page-banner compact"><span className="eyebrow">One last signal</span><h1>LOCK IN<br /><em>PICKUP.</em></h1></header>
      <div className="checkout-layout">
        <form onSubmit={submit}>
          <fieldset><legend><b>01</b> Contact</legend><div className="form-grid"><label>Full name<Input name="name" autoComplete="name" required /></label><label>Phone<Input name="phone" type="tel" autoComplete="tel" required /></label><label className="wide">Email receipt<Input name="email" type="email" autoComplete="email" required /></label></div></fieldset>
          <fieldset><legend><b>02</b> Pickup window</legend><div className="pickup-windows">{windows.map((window, index) => <label key={window}><input type="radio" name="pickupWindow" value={window} defaultChecked={index === 0} /><span><Clock3 />{window}</span></label>)}</div><p className="pickup-address"><MapPin /> 655 S Willow St Unit 115A, Manchester, NH</p></fieldset>
          <fieldset><legend><b>03</b> Counter notes</legend><label>Optional request<textarea name="notes" placeholder="Flavor substitutions, arrival notes, or anything the team should know." /></label></fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button size="lg" disabled={busy}>{busy ? "Placing order…" : "Place pickup order"}</Button>
        </form>
        <aside className="checkout-summary"><span className="eyebrow">Your lineup</span>{lines.map((line) => <div key={line.id}><span>{line.title} × {line.quantity}</span><b>{formatMoney(line.price * line.quantity)}</b></div>)}<div className="checkout-total"><span>Pay at pickup</span><strong>{formatMoney(total)}</strong></div><p>No online payment is captured. The counter completes payment through Clover.</p></aside>
      </div>
    </main>
  );
}
