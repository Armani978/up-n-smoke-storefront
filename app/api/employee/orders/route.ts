import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { listAdminOrders } from "@/lib/medusa/admin";

export async function GET() {
  const access = await employeeApiAccess("orders.read");
  if ("response" in access) return access.response;
  return NextResponse.json({ orders: await listAdminOrders(access.session) });
}
