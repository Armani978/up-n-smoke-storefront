import { NextResponse, type NextRequest } from "next/server";
import logo from "@/src/assets/up-n-smoke-logo.png";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(logo.src, request.url), 307);
}
