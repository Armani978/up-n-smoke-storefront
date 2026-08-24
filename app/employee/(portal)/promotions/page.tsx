import { PromoEditor } from "@/components/employee/promo-editor";
import { requireEmployee } from "@/lib/auth/session";

export default async function PromotionsPage() {
  await requireEmployee("promos.write");
  return <PromoEditor />;
}
