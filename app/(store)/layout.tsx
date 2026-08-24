import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { NicotineWarning } from "@/components/storefront/nicotine-warning";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-shell">
      <NicotineWarning />
      <StoreHeader />
      {children}
      <StoreFooter />
    </div>
  );
}
