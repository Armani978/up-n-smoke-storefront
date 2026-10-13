import { Clock3, MapPin, ScanLine } from "lucide-react";
import { STORE_INFO } from "@/lib/store-info";

export function FallBenefits() {
  return (
    <section className="fall-benefits" aria-label="Your local pickup">
      <article><Clock3 aria-hidden="true" /><div><span>Ready when you are</span><strong>Pickup in {STORE_INFO.pickupWindow}</strong><p>Reserve online. Pay at the counter.</p></div></article>
      <article><MapPin aria-hidden="true" /><div><span>Your neighborhood counter</span><strong>{STORE_INFO.address}</strong><p>{STORE_INFO.locality}</p></div></article>
      <article><ScanLine aria-hidden="true" /><div><span>Know before you go</span><strong>Stock counts on every item</strong><p>Check the menu before reserving.</p></div></article>
    </section>
  );
}
