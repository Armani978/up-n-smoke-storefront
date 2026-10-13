import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { employeePickupRequest, MedusaPickupError } from "@/lib/medusa/pickup";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await employeeApiAccess("pickup.verify");
  if ("response" in access) return access.response;
  try {
    const { id } = await params;
    return NextResponse.json(await employeePickupRequest(access.session, `/${id}/verify-age`, await request.json()));
  } catch (error) {
    if (error instanceof MedusaPickupError) return NextResponse.json({ error: error.message, ...error.payload }, { status: error.status });
    return NextResponse.json({ error: "Unable to verify age." }, { status: 502 });
  }
}
