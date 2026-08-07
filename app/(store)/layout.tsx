import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-shell">
      <StoreHeader />
      {children}
      <StoreFooter />
    </div>
  );
}
