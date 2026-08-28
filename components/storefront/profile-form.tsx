"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({ firstName, lastName, phone }: { firstName?: string; lastName?: string; phone?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/customer/profile", { method: "POST", body: new FormData(event.currentTarget) });
    if (response.ok) window.location.reload();
    else setMessage("Could not save your profile.");
  }

  if (!open) return <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Edit profile</Button>;
  return (
    <form className="address-form" onSubmit={submit}>
      <div className="form-grid">
        <label>First name<Input name="first_name" defaultValue={firstName} /></label>
        <label>Last name<Input name="last_name" defaultValue={lastName} /></label>
        <label className="wide">Phone<Input name="phone" type="tel" defaultValue={phone} /></label>
      </div>
      {message && <p className="form-error">{message}</p>}
      <div>
        <Button>Save profile</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
