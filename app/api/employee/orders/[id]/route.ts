import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { adminFetch } from "@/lib/medusa/admin";
import type { PickupStatus } from "@/lib/types";

// Completion is deliberately excluded: pickup handoff must go through the
// server-authoritative ID checklist and fulfillment workflow.
const allowed: PickupStatus[] = ["pending", "accepted", "preparing", "ready", "arrived", "cancelled"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await employeeApiAccess("orders.write");
  if ("response" in access) return access.response;
  const { session } = access;
  const { id } = await params;
  const { pickupStatus } = await request.json() as { pickupStatus: PickupStatus };
  if (!allowed.includes(pickupStatus)) return NextResponse.json({ error: "Invalid pickup status." }, { status: 400 });
  const existing = await adminFetch<{ order: { metadata?: Record<string, unknown> } }>(session, `/admin/orders/${id}`);
  const result = await adminFetch(session, `/admin/orders/${id}`, { method: "POST", body: JSON.stringify({ metadata: { ...(existing?.order.metadata ?? {}), pickup_status: pickupStatus } }) });
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Unable to update order." }, { status: 502 });
}
