import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/session";
import { updateCustomerProfile } from "@/lib/medusa/customer";

export async function POST(request: Request) {
  const session = await requireCustomer();
  const form = await request.formData();
  const fields = ["first_name", "last_name", "phone"];
  const input = Object.fromEntries(fields.map((field) => [field, String(form.get(field) ?? "")]));
  const { status, body } = await updateCustomerProfile(session, input);
  if (status >= 200 && status < 300 && body) return NextResponse.json(body);
  return NextResponse.json({ error: "Unable to update your profile." }, { status: status || 502 });
}
