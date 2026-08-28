import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth/session";
import { issuePickupPass, MedusaPickupError } from "@/lib/medusa/pickup";

export async function POST(request: Request) {
  try {
    const { orderId, email, regenerate } = await request.json() as { orderId?: string; email?: string; regenerate?: boolean };
    if (!orderId || !email) return NextResponse.json({ error: "Order and email are required." }, { status: 400 });
    const result = await issuePickupPass(orderId, email, await getCustomerSession() ?? undefined, regenerate ?? true);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MedusaPickupError) return NextResponse.json({ error: error.message, ...error.payload }, { status: error.status });
    return NextResponse.json({ error: "Unable to create the pickup pass." }, { status: 502 });
  }
}
