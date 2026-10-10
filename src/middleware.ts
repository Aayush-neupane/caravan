import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isStaffRole } from "./lib/roles";

// Edge defence-in-depth: every /admin page and /api/admin route re-checks
// the session here, before any page or handler code runs. (Each API route
// still enforces its own per-action role check — this layer only
// short-circuits the obviously unauthorised.)
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string } | null)?.role;
  const staff = !!token && isStaffRole(role);

  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (!staff) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
    return NextResponse.next();
  }
  if (!token) {
    return NextResponse.redirect(new URL("/account/sign-in", req.url));
  }
  if (!staff) {
    return NextResponse.redirect(new URL("/account?error=staff_only", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
