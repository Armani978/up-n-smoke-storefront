import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backend = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  let medusa = false;
  try {
    const response = await fetch(`${backend}/health`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    medusa = response.ok;
  } catch {
    medusa = false;
  }
  return NextResponse.json(
    { status: medusa ? "healthy" : "degraded", app: true, medusa, checkedAt: new Date().toISOString() },
    { status: medusa ? 200 : 503 },
  );
}
