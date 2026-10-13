import { PickupQueue } from "@/components/employee/pickup-queue";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminOrders } from "@/lib/medusa/admin";
import { STORE_TIMEZONE } from "@/lib/store-time";

export default async function PickupsPage() {
  const session = await requireEmployee("orders.read");
  return <PickupQueue initialOrders={await listAdminOrders(session)} initialUpdatedAt={new Date().toISOString()} timeZone={STORE_TIMEZONE} />;
}
