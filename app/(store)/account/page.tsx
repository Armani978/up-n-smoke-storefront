import { MapPin, PackageCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { AddressForm } from "@/components/storefront/address-form";
import { Button } from "@/components/ui/button";
import { requireCustomer } from "@/lib/auth/session";
import { getCustomerProfile } from "@/lib/medusa/customer";

export default async function AccountPage() {
  const session = await requireCustomer();
  const customer = await getCustomerProfile(session);
  return (
    <main className="account-page">
      <header><span className="eyebrow">Customer account</span><h1>WELCOME<br /><em>BACK.</em></h1><p>{customer?.first_name ? `${customer.first_name} ${customer.last_name ?? ""}` : session.email}</p></header>
      <div className="account-grid">
        <section className="account-card"><UserRound /><span>Profile</span><h2>{customer?.email ?? session.email}</h2><p>{customer?.phone || "Add your phone during checkout."}</p></section>
        <section className="account-card action"><PackageCheck /><span>Pickup history</span><h2>YOUR ORDERS</h2><Button asChild variant="dark"><Link href="/orders">View order history</Link></Button></section>
        <section className="address-book"><div><MapPin /><span className="eyebrow">Saved addresses</span></div>{customer?.addresses?.length ? <div className="address-list">{customer.addresses.map((address) => <article key={address.id}><b>{address.address_name || "Pickup contact"}</b><span>{address.address_1}<br />{address.city}, {address.province} {address.postal_code}</span></article>)}</div> : <p>No saved addresses yet.</p>}<AddressForm /></section>
      </div>
      <form action="/api/auth/logout" method="post"><Button variant="outline">Log out</Button></form>
    </main>
  );
}
