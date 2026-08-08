import { PickupScanner } from "@/components/employee/pickup-scanner";
import { requireEmployee } from "@/lib/auth/session";

export default async function PickupScannerPage() {
  await requireEmployee("pickup.read");
  return <PickupScanner />;
}
