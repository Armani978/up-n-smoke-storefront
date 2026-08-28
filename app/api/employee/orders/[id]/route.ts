import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { adminFetch } from "@/lib/medusa/admin";
import type { PickupStatus } from "@/lib/types";

// "arrived" and "completed" are deliberately excluded as reachable targets
// (and as source states with any legal next step) here: those two are only
// ever written by Sprint 01's server-authoritative resolve/complete routes
// as part of the real pickup handoff, never by this generic queue-status
// route. Allowing this route to set or move away from them would let the
// employee queue's view of pickup_status drift out of sync with what that
// workflow actually did. The remaining transitions mirror exactly what the
// queue UI offers: adjacent prep stages forward, or cancel from any active
// stage.
const transitions: Partial<Record<PickupStatus, PickupStatus[]>> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["cancelled"],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await employeeApiAccess("orders.write");
  if ("response" in access) return access.response;
  const { session } = access;
  const { id } = await params;
  const { pickupStatus } = await request.json() as { pickupStatus: PickupStatus };
  const existing = await adminFetch<{ order: { metadata?: Record<string, unknown> } }>(session, `/admin/orders/${id}`);
  if (!existing) return NextResponse.json({ error: "Unable to load this order." }, { status: 502 });
  const current = String(existing.order.metadata?.pickup_status || "pending") as PickupStatus;
  const allowedNext = transitions[current] ?? [];
  if (!allowedNext.includes(pickupStatus)) {
    return NextResponse.json({ error: `Cannot move a ${current} order to ${pickupStatus}.` }, { status: 409 });
  }
  const result = await adminFetch(session, `/admin/orders/${id}`, { method: "POST", body: JSON.stringify({ metadata: { ...(existing.order.metadata ?? {}), pickup_status: pickupStatus } }) });
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Unable to update order." }, { status: 502 });
}
