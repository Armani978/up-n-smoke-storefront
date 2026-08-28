import { notFound } from "next/navigation";
import { PickupAlreadyIssued, PickupCompleted, PickupPass } from "@/components/pickup/pickup-pass";
import { requireCustomer } from "@/lib/auth/session";
import { getCustomerOrders } from "@/lib/medusa/customer";
import { issuePickupPass, MedusaPickupError } from "@/lib/medusa/pickup";
import type { PickupAlreadyIssuedData, PickupPassData, PickupVerificationData } from "@/lib/types";

export default async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomer();
  const { id } = await params;
  const orders = await getCustomerOrders(session);
  if (!orders.some((item) => String(item.id) === id)) notFound();
  let pass: PickupPassData | null = null;
  let alreadyIssued: PickupAlreadyIssuedData | null = null;
  let completed: PickupVerificationData | null = null;
  let unavailable = "";
  try {
    // regenerate=false: viewing/reloading this page must never rotate a
    // still-valid, unredeemed pickup code out from under the customer —
    // the plaintext token is never stored, so a silent rotation here would
    // permanently kill a code they may have already screenshotted.
    const result = await issuePickupPass(id, session.email, session, false);
    if ("token" in result) pass = result;
    else alreadyIssued = result;
  } catch (error) {
    if (error instanceof MedusaPickupError && error.status === 410 && error.payload.verificationId) {
      completed = error.payload as unknown as PickupVerificationData;
    } else {
      unavailable = error instanceof Error ? error.message : "Please try again shortly.";
    }
  }
  if (pass) return <main className="customer-pass-page"><PickupPass pass={pass} /></main>;
  if (alreadyIssued) return <main className="customer-pass-page"><PickupAlreadyIssued pickup={alreadyIssued} orderId={id} email={session.email} /></main>;
  if (completed) return <main className="customer-pass-page"><PickupCompleted pickup={completed} /></main>;
  return <main className="customer-pass-page"><section className="pickup-pass-unavailable"><h1>PICKUP PASS UNAVAILABLE</h1><p>{unavailable}</p></section></main>;
}
