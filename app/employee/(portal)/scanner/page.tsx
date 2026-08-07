import { BarcodeScanner } from "@/components/employee/barcode-scanner";
import { requireEmployee } from "@/lib/auth/session";
import { listAdminProducts } from "@/lib/medusa/admin";

export default async function ScannerPage() {
  const session = await requireEmployee("products.read");
  return <BarcodeScanner products={await listAdminProducts(session)} />;
}
