import { PickupQueue } from "@/components/employee/pickup-queue";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminOrders } from "@/lib/medusa/admin";

export default async function PickupsPage() {
  const session = await requireEmployee("orders.read");
  return <PickupQueue initialOrders={await listAdminOrders(session)} />;
}
