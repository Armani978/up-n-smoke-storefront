import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/session";
import { deleteCustomerAddress, updateCustomerAddress } from "@/lib/medusa/customer";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomer();
  const { id } = await params;
  const form = await request.formData();
  const fields = ["first_name", "last_name", "address_1", "city", "province", "postal_code", "country_code", "phone"];
  const input = Object.fromEntries(fields.map((field) => [field, String(form.get(field) ?? "")]));
  const { status, body } = await updateCustomerAddress(session, id, input);
  if (status >= 200 && status < 300 && body) return NextResponse.json(body);
  // Medusa scopes the address lookup to the authenticated customer's own id
  // (see lib/medusa/customer.ts), so an id belonging to a different
  // customer resolves as "not found" here too — never as a leaked 200.
  return NextResponse.json({ error: status === 404 ? "That address was not found." : "Unable to update this address." }, { status: status || 502 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCustomer();
  const { id } = await params;
  const { status, body } = await deleteCustomerAddress(session, id);
  if (status >= 200 && status < 300 && body) return NextResponse.json(body);
  return NextResponse.json({ error: status === 404 ? "That address was not found." : "Unable to delete this address." }, { status: status || 502 });
}
