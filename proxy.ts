import { NextResponse, type NextRequest } from "next/server";
import { EMPLOYEE_COOKIE } from "@/lib/auth/constants";

function secured(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isEmployeeApi = pathname.startsWith("/api/employee/");
  const isLoginPage = pathname === "/employee/login";
  const hasSessionCookie = Boolean(request.cookies.get(EMPLOYEE_COOKIE)?.value);

  if (!isLoginPage && !hasSessionCookie) {
    if (isEmployeeApi) {
      return secured(NextResponse.json({ error: "Authentication required." }, { status: 401 }));
    }
    const login = new URL("/employee/login", request.url);
    login.searchParams.set("next", pathname);
    return secured(NextResponse.redirect(login));
  }

  return secured(NextResponse.next());
}

export const config = {
  matcher: ["/employee/:path*", "/api/employee/:path*"],
};
