"use client";

import { AlertTriangle, Check, CheckCircle2, IdCard, LoaderCircle, MapPin, PackageCheck, RotateCcw, ShieldCheck, UserRound, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/utils";
import type { PickupVerificationData } from "@/lib/types";

type AgeResult = { age: number; passed: boolean; today: string; cutoff: string; timeZone: string };
const formatShort = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)).toUpperCase();

export function PickupVerification({ verificationId }: { verificationId: string }) {
  const [data, setData] = useState<PickupVerificationData | null>(null);
  const [loadingError, setLoadingError] = useState("");
  const [dob, setDob] = useState({ month: "", day: "", year: "" });
  const [age, setAge] = useState<AgeResult | null>(null);
  const [ageError, setAgeError] = useState("");
  const [checkingAge, setCheckingAge] = useState(false);
  const [checks, setChecks] = useState({ customer_match: false, physical_id_presented: false, id_valid_not_expired: false, age_confirmed: false });
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");

  useEffect(() => {
    void fetch(`/api/employee/pickups/${verificationId}`, { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to open pickup.");
      setData(result);
    }).catch((error) => setLoadingError(error instanceof Error ? error.message : "Unable to open pickup."));
  }, [verificationId]);

  const dobIso = useMemo(() => dob.year.length === 4 && dob.month.length >= 1 && dob.day.length >= 1 ? `${dob.year}-${dob.month.padStart(2, "0")}-${dob.day.padStart(2, "0")}` : "", [dob]);

  useEffect(() => {
    if (!dobIso || !data?.requiresAgeVerification) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCheckingAge(true); setAgeError("");
      void fetch(`/api/employee/pickups/${verificationId}/verify-age`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date_of_birth: dobIso, method: "manual_dob" }), signal: controller.signal }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to verify age.");
        setAge(result);
        if (!result.passed) setChecks((current) => ({ ...current, age_confirmed: false }));
      }).catch((error) => { if (error.name !== "AbortError") { setAge(null); setAgeError(error.message); } }).finally(() => setCheckingAge(false));
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [data?.requiresAgeVerification, dobIso, verificationId]);

  const requiredComplete = data ? checks.customer_match && (!data.requiresAgeVerification || (Boolean(dobIso) && checks.physical_id_presented && checks.id_valid_not_expired && checks.age_confirmed && age?.passed === true)) : false;
  async function complete() {
    setCompleting(true); setCompleteError("");
    try {
      const response = await fetch(`/api/employee/pickups/${verificationId}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checklist: checks }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to complete pickup.");
      setData(result);
    } catch (error) { setCompleteError(error instanceof Error ? error.message : "Unable to complete pickup."); }
    finally { setCompleting(false); }
  }

  if (loadingError) return <div className="ops-page pickup-load-state"><AlertTriangle /><h1>CAN’T OPEN PICKUP</h1><p>{loadingError}</p><Button asChild><Link href="/employee/pickups/scan"><RotateCcw /> Back to scanner</Link></Button></div>;
  if (!data) return <div className="ops-page pickup-load-state"><LoaderCircle className="spin" /><h1>OPENING PICKUP</h1><p>Confirming the secure pass with Medusa…</p></div>;
  if (data.status === "completed") return <div className="ops-page pickup-success"><CheckCircle2 /><span>PICKUP COMPLETE</span><h1>ORDER #{data.order.displayId}</h1><p>{data.order.customerName}</p>{data.completedBy && <small>Verified by employee {data.completedBy}</small>}{data.completedAt && <small>Completed {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(data.completedAt))}</small>}<Button asChild size="lg"><Link href="/employee/pickups/scan">Scan next order</Link></Button></div>;

  return <div className="ops-page pickup-verify-page"><header className="pickup-verify-head"><div><span>PICKUP VERIFICATION</span><h1>ORDER #{data.order.displayId}</h1></div><b data-status={data.order.status}>{data.order.status}</b></header><div className="pickup-verify-grid"><aside className="pickup-order-summary"><div className="pickup-person"><UserRound /><strong>{data.order.customerName}</strong><span><MapPin /> {data.order.pickupLocation}</span><small>Placed {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(data.order.createdAt))}</small></div><header><span>ITEMS</span><b>{data.order.items.reduce((sum, item) => sum + item.quantity, 0)}</b></header><div className="pickup-item-list">{data.order.items.map((item) => <article key={item.id}>{item.thumbnail ? <Image src={item.thumbnail} alt="" width={64} height={64} /> : <div className="pickup-item-fallback"><PackageCheck /></div>}<span><strong>{item.title}</strong><small>{[item.variantTitle, item.sku].filter(Boolean).join(" · ")}</small></span><b>×{item.quantity}</b><em>{formatMoney(item.total, data.order.currency)}</em></article>)}</div></aside><main className="id-check-panel"><header><IdCard /><span>IDENTIFICATION CHECK</span>{data.requiresAgeVerification && <b>21+ ID REQUIRED</b>}</header>{data.requiresAgeVerification ? <><section className="dob-cutoff"><div><span>TODAY</span><strong>{formatShort(data.ageContext.today)}</strong></div><div><span>21+ DOB CUTOFF</span><p>To be 21 today, date of birth must be on or before:</p><strong>{formatShort(data.ageContext.cutoff)}</strong></div><small>Store date · {data.ageContext.timeZone}</small></section><section className="dob-entry"><header><span>CUSTOMER DOB</span>{checkingAge && <LoaderCircle className="spin" />}</header><div><label>MM<input aria-label="Birth month" inputMode="numeric" maxLength={2} value={dob.month} onChange={(event) => setDob((current) => ({ ...current, month: event.target.value.replace(/\D/g, "").slice(0, 2) }))} placeholder="MM" /></label><label>DD<input aria-label="Birth day" inputMode="numeric" maxLength={2} value={dob.day} onChange={(event) => setDob((current) => ({ ...current, day: event.target.value.replace(/\D/g, "").slice(0, 2) }))} placeholder="DD" /></label><label>YYYY<input aria-label="Birth year" inputMode="numeric" maxLength={4} value={dob.year} onChange={(event) => setDob((current) => ({ ...current, year: event.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="YYYY" /></label>{age && <div className="age-number"><span>AGE</span><strong>{age.age}</strong></div>}</div>{ageError && <p className="pickup-inline-error">{ageError}</p>}{age && <div className={age.passed ? "age-result passed" : "age-result failed"}>{age.passed ? <CheckCircle2 /> : <XCircle />}<strong>{age.passed ? "21 OR OLDER" : "UNDER 21"}</strong><span>{age.passed ? "AGE VERIFIED" : "AGE VERIFICATION FAILED"}</span></div>}</section></> : <section className="no-age-required"><ShieldCheck /><h2>STANDARD PICKUP</h2><p>This order does not contain age-restricted products.</p></section>}<section className="verification-checklist"><h2>REQUIRED CHECKLIST</h2>{([["customer_match", "Customer matches the name/order where required"], ...(data.requiresAgeVerification ? [["physical_id_presented", "Physical government-issued photo ID was presented"], ["id_valid_not_expired", "ID appears valid and not expired"], ["age_confirmed", "Customer is 21 or older"]] : [])] as Array<[keyof typeof checks, string]>).map(([key, label]) => <label key={key} className={checks[key] ? "checked" : ""}><input type="checkbox" checked={checks[key]} disabled={key === "age_confirmed" && age?.passed !== true} onChange={(event) => setChecks((current) => ({ ...current, [key]: event.target.checked }))} /><i>{checks[key] && <Check />}</i><span>{label}</span></label>)}</section></main></div>{completeError && <p className="pickup-complete-error" role="alert">{completeError}</p>}<Dialog><DialogTrigger asChild><Button className="pickup-complete-button" size="lg" disabled={!requiredComplete || completing}>{completing ? <LoaderCircle className="spin" /> : <ShieldCheck />} Verify & complete pickup</Button></DialogTrigger><DialogContent><DialogTitle className="pickup-dialog-title">Complete pickup for Order #{data.order.displayId}?</DialogTitle><DialogDescription className="pickup-dialog-copy">This creates the Medusa fulfillment and permanently invalidates the customer’s QR code.</DialogDescription><dl className="pickup-dialog-facts"><div><dt>Customer</dt><dd>{data.order.customerName}</dd></div><div><dt>Items</dt><dd>{data.order.items.reduce((sum, item) => sum + item.quantity, 0)}</dd></div><div><dt>Age verification</dt><dd>{data.requiresAgeVerification ? (age?.passed ? "Passed" : "Required") : "Not required"}</dd></div></dl><div className="pickup-dialog-actions"><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={() => void complete()} disabled={completing}>{completing ? "Completing…" : "Complete pickup"}</Button></div></DialogContent></Dialog></div>;
}
