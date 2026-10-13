import { NextResponse, type NextRequest } from "next/server";
import { clearSessions } from "@/lib/auth/session";
import { redirectUrl } from "@/lib/http/redirect-url";

export async function POST(request: NextRequest) {
  await clearSessions();
  return NextResponse.redirect(redirectUrl("/", request), 303);
}
