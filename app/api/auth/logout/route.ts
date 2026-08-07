import { NextResponse, type NextRequest } from "next/server";
import { clearSessions } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await clearSessions();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
