import { PickupVerification } from "@/components/employee/pickup-verification";
import { requireEmployee } from "@/lib/auth/session";

export default async function PickupVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireEmployee("pickup.read");
  const { id } = await params;
  return <PickupVerification verificationId={id} />;
}
