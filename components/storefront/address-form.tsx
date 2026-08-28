"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ExistingAddress = {
  id: string;
  first_name?: string;
  last_name?: string;
  address_1?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
};

export function AddressForm({ address, onDone }: { address?: ExistingAddress; onDone?: () => void }) {
  const [open, setOpen] = useState(Boolean(address));
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = address ? `/api/customer/addresses/${address.id}` : "/api/customer/addresses";
    const response = await fetch(url, { method: "POST", body: new FormData(event.currentTarget) });
    if (response.ok) { if (onDone) onDone(); else window.location.reload(); }
    else setMessage("Could not save this address.");
  }

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Add an address</Button>;
  return (
    <form className="address-form" onSubmit={submit}>
      <div className="form-grid">
        <label>First name<Input name="first_name" defaultValue={address?.first_name} required /></label>
        <label>Last name<Input name="last_name" defaultValue={address?.last_name} required /></label>
        <label className="wide">Address<Input name="address_1" defaultValue={address?.address_1} required /></label>
        <label>City<Input name="city" defaultValue={address?.city} required /></label>
        <label>State<Input name="province" defaultValue={address?.province ?? "NH"} required /></label>
        <label>ZIP<Input name="postal_code" defaultValue={address?.postal_code} required /></label>
        <label>Phone<Input name="phone" type="tel" defaultValue={address?.phone} /></label>
      </div>
      <input type="hidden" name="country_code" value="us" />
      {message && <p className="form-error">{message}</p>}
      <div>
        <Button>Save address</Button>
        <Button type="button" variant="ghost" onClick={() => (onDone ? onDone() : setOpen(false))}>Cancel</Button>
      </div>
    </form>
  );
}
