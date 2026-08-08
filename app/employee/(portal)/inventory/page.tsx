import { InventoryManager } from "@/components/employee/inventory-manager";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminProducts } from "@/lib/medusa/admin";
import { STORE_TIMEZONE } from "@/lib/store-time";

export default async function InventoryPage() {
  const session = await requireEmployee("products.read");
  return <InventoryManager initialProducts={await listAdminProducts(session)} canWrite={session.role !== "employee"} initialUpdatedAt={new Date().toISOString()} timeZone={STORE_TIMEZONE} />;
}
