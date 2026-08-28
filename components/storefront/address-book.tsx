"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AddressForm } from "@/components/storefront/address-form";
import type { CustomerProfile } from "@/lib/medusa/customer";

type Address = NonNullable<CustomerProfile["addresses"]>[number];

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function remove(id: string) {
    setDeletingId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/customer/addresses/${id}`, { method: "DELETE" });
      if (response.ok) window.location.reload();
      else setMessage("Could not delete this address.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!addresses.length) return <p>No saved addresses yet.</p>;

  return (
    <div className="address-list">
      {message && <p className="form-error">{message}</p>}
      {addresses.map((address) => editingId === address.id ? (
        <AddressForm key={address.id} address={address} onDone={() => setEditingId(null)} />
      ) : (
        <article key={address.id}>
          <b>{address.address_name || "Pickup contact"}</b>
          <span>{address.address_1}<br />{address.city}, {address.province} {address.postal_code}</span>
          <div className="address-actions">
            <button type="button" onClick={() => setEditingId(address.id)} aria-label="Edit address"><Pencil /> Edit</button>
            <button type="button" onClick={() => void remove(address.id)} disabled={deletingId === address.id} aria-label="Delete address"><Trash2 /> {deletingId === address.id ? "Deleting…" : "Delete"}</button>
          </div>
        </article>
      ))}
    </div>
  );
}
