"use client";

import { CheckCircle2, Clock3, LoaderCircle, MapPin, RefreshCw } from "lucide-react";
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

type CheckoutCompletion = {
  orderId: string;
  displayId: string;
  email: string;
  pickupWindow: string;
  pass: PickupPassData | null;
  passLoading: boolean;
  passError?: string;
};

async function fetchPickupPass(orderId: string, email: string) {
  const response = await fetch("/api/pickup-pass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, email }),
  });
  const payload = await response.json().catch(() => null) as (PickupPassData & { error?: string }) | null;
  if (!response.ok || !payload) throw new Error(payload?.error || "Unable to create the pickup pass.");
  return payload;
}

export default function CheckoutPage() {
  const { lines, subtotal, completePickup, busy } = useCart();
  const [complete, setComplete] = useState<CheckoutCompletion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const total = subtotal;

  useEffect(() => {
    if (!lines.length && !complete && !submitting) router.replace("/cart");
  }, [complete, lines.length, router, submitting]);

  async function loadPass(orderId: string, email: string) {
    setComplete((current) => current ? { ...current, passLoading: true, passError: undefined } : current);
    try {
      const pass = await fetchPickupPass(orderId, email);
      setComplete((current) => current ? { ...current, pass, passLoading: false } : current);
    } catch (caught) {
      setComplete((current) => current ? {
        ...current,
        passLoading: false,
        passError: caught instanceof Error ? caught.message : "Unable to create the pickup pass.",
      } : current);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
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
      setComplete({ orderId: result.id, displayId: result.displayId, email, pickupWindow, pass: null, passLoading: true });
      await loadPass(result.id, email);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to place the pickup order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!lines.length && !complete) {
    return submitting
      ? <main className="checkout-pass-loading" aria-live="polite"><LoaderCircle className="spin" /><span>ORDER PLACED</span><h1>CREATING<br /><em>YOUR CODE.</em></h1><p>Keep this page open while we secure your pickup code.</p></main>
      : null;
  }

  if (complete) {
    return <main className="checkout-complete-shell"><section className="checkout-complete"><CheckCircle2 /><span>ORDER #{complete.displayId}</span><h1>LOCKED<br /><em>IN.</em></h1><p>Your pickup is in the queue for <b>{complete.pickupWindow}</b>. Pay through Clover when you arrive.</p><Button asChild><Link href="/menu">Back to the menu</Link></Button></section>{complete.pass ? <PickupPass pass={complete.pass} /> : complete.passLoading ? <section className="pickup-pass-state" aria-live="polite"><LoaderCircle className="spin" /><h2>CREATING YOUR CODE</h2><p>Keep this page open. Your pickup code is almost ready.</p></section> : <section className="pass-error" role="alert"><h2>YOUR ORDER IS SAFE.</h2><p>The pickup code did not load, but you do not need to place another order.</p>{complete.passError && <small>{complete.passError}</small>}<Button variant="outline" onClick={() => void loadPass(complete.orderId, complete.email)}><RefreshCw /> Retry pickup code</Button></section>}</main>;
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
          <Button size="lg" disabled={busy || submitting}>{busy || submitting ? "Placing order…" : "Place pickup order"}</Button>
        </form>
        <aside className="checkout-summary"><span className="eyebrow">Your lineup</span>{lines.map((line) => <div key={line.id}><span>{line.title} × {line.quantity}</span><b>{formatMoney(line.price * line.quantity)}</b></div>)}<div className="checkout-total"><span>Pay at pickup</span><strong>{formatMoney(total)}</strong></div><p>No online payment is captured. The counter completes payment through Clover.</p></aside>
      </div>
    </main>
  );
}
