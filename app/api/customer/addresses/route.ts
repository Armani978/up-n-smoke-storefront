import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/session";
import { addCustomerAddress } from "@/lib/medusa/customer";

export async function POST(request: Request) {
  const session = await requireCustomer();
  const form = await request.formData();
  const fields = ["first_name", "last_name", "address_1", "city", "province", "postal_code", "country_code", "phone"];
  const input = Object.fromEntries(fields.map((field) => [field, String(form.get(field) ?? "")]));
  const result = await addCustomerAddress(session, input);
  return result ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Unable to save address." }, { status: 502 });
}
