import { notFound } from "next/navigation";
import { PickupCompleted, PickupPass } from "@/components/pickup/pickup-pass";
import { requireCustomer } from "@/lib/auth/session";
import { getCustomerOrders } from "@/lib/medusa/customer";
import { issuePickupPass, MedusaPickupError } from "@/lib/medusa/pickup";
import type { PickupVerificationData } from "@/lib/types";

export default async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomer();
  const { id } = await params;
  const orders = await getCustomerOrders(session);
  if (!orders.some((item) => String(item.id) === id)) notFound();
  let pass;
  let completed: PickupVerificationData | null = null;
  let unavailable = "";
  try {
    pass = await issuePickupPass(id, session.email, session);
  } catch (error) {
    if (error instanceof MedusaPickupError && error.status === 410 && error.payload.verificationId) {
      completed = error.payload as unknown as PickupVerificationData;
    } else {
      unavailable = error instanceof Error ? error.message : "Please try again shortly.";
    }
  }
  if (pass) return <main className="customer-pass-page"><PickupPass pass={pass} /></main>;
  if (completed) return <main className="customer-pass-page"><PickupCompleted pickup={completed} /></main>;
  return <main className="customer-pass-page"><section className="pickup-pass-unavailable"><h1>PICKUP PASS UNAVAILABLE</h1><p>{unavailable}</p></section></main>;
}
