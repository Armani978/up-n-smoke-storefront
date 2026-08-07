import { InventoryManager } from "@/components/employee/inventory-manager";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminProducts } from "@/lib/medusa/admin";

export default async function InventoryPage() {
  const session = await requireEmployee("products.read");
  return <InventoryManager initialProducts={await listAdminProducts(session)} canWrite={session.role !== "employee"} />;
}
