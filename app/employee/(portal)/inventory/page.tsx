import { AlertTriangle } from "lucide-react";
import { DashboardRefresh } from "@/components/employee/dashboard-refresh";
import { InventoryManager } from "@/components/employee/inventory-manager";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminProducts } from "@/lib/medusa/admin";
import { STORE_TIMEZONE } from "@/lib/store-time";

export default async function InventoryPage() {
  const session = await requireEmployee("products.read");
  let products: Awaited<ReturnType<typeof listAdminProducts>> = [];
  let dataError = false;
  try {
    products = await listAdminProducts(session, true);
  } catch {
    dataError = true;
  }
  if (dataError) {
    return (
      <div className="ops-page">
        <section className="ops-recovery" role="alert">
          <AlertTriangle aria-hidden="true" />
          <div><h2>MEDUSA SIGNAL LOST.</h2><p>The product catalog could not be loaded.</p></div>
          <DashboardRefresh retry auto={false} />
        </section>
      </div>
    );
  }
  return <InventoryManager initialProducts={products} canWrite={session.role !== "employee"} initialUpdatedAt={new Date().toISOString()} timeZone={STORE_TIMEZONE} />;
}
