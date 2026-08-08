import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { employeeApiAccess } from "@/lib/auth/session";
import { adminFetch } from "@/lib/medusa/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string; locationId: string }> },
) {
  const access = await employeeApiAccess("inventory.write");
  if ("response" in access) return access.response;

  const { session } = access;
  const { itemId, locationId } = await params;
  const { quantity } = (await request.json()) as { quantity: number };

  if (!Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json(
      { error: "Quantity must be a non-negative whole number." },
      { status: 400 },
    );
  }

  const result = await adminFetch(
    session,
    `/admin/inventory-items/${encodeURIComponent(itemId)}/location-levels/${encodeURIComponent(locationId)}`,
    {
      method: "POST",
      body: JSON.stringify({ stocked_quantity: quantity }),
    },
  );

  if (!result) {
    return NextResponse.json(
      { error: "Medusa could not update this inventory location." },
      { status: 502 },
    );
  }

  revalidateTag("catalog", "max");
  return NextResponse.json(result);
}