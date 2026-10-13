"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddressForm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/customer/addresses", { method: "POST", body: new FormData(event.currentTarget) });
    if (response.ok) window.location.reload();
    else setMessage("Could not save this address.");
  }

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Add an address</Button>;
  return <form className="address-form" onSubmit={submit}><div className="form-grid"><label>First name<Input name="first_name" required /></label><label>Last name<Input name="last_name" required /></label><label className="wide">Address<Input name="address_1" required /></label><label>City<Input name="city" required /></label><label>State<Input name="province" defaultValue="NH" required /></label><label>ZIP<Input name="postal_code" required /></label><label>Phone<Input name="phone" type="tel" /></label></div><input type="hidden" name="country_code" value="us" />{message && <p className="form-error">{message}</p>}<div><Button>Save address</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div></form>;
}
