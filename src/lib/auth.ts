import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authLockedOut, clearAuthFailures, rateLimit, recordAuthFailure } from "./rateLimit";
import { STAFF_ROLES } from "./roles";

// Production refuses to boot without a real session secret — demo fallback
// is development-only.
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set in production.");
}

// Demo auth: a single seeded staff account for local preview. Guests never
// sign in — reservations are guest-only, found by email + voucher reference.
// Production: set AUTH_ALLOW_DEMO!=="true" (default) and these logins are
// rejected — wire Email/OAuth + hashed DB users instead. Role checks below
// remain the enforcement point.

const DEMO_ALLOW = process.env.AUTH_ALLOW_DEMO === "true" || process.env.NODE_ENV !== "production";

export const DEMO_USERS = [
  { id: "demo-owner", email: "owner@hartleyandmoor.example", password: process.env.DEMO_OWNER_PASSWORD ?? "owner1234", name: "M. Hartley", role: "owner" },
];

export const authOptions: NextAuthOptions = {
  // 8h suits shared ops machines; revocation lag is bounded by this window.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!DEMO_ALLOW) return null;
        const email = (credentials?.email ?? "").toLowerCase().trim().slice(0, 120);
        // Password-spray brake: per-IP budget across all emails, plus the
        // per-email lockout below. Best-effort header read (edge + node).
        try {
          const headers = (req as unknown as { headers?: Record<string, string | string[]> })?.headers;
          const fwd = headers ? headers["x-forwarded-for"] ?? headers["X-Forwarded-For"] : undefined;
          const ip = (Array.isArray(fwd) ? fwd[0] : fwd ?? "local").split(",")[0].trim().slice(0, 64);
          if (!rateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000).ok) return null;
        } catch {
          /* fall through to credential check */
        }
        // Brute-force lockout: 5 failures per 15 minutes, per email.
        if (email && authLockedOut(`login:${email}`)) return null;
        const found = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email && u.password === credentials?.password
        );
        if (found) {
          if (email) clearAuthFailures(`login:${email}`);
          return { id: found.id, email: found.email, name: found.name, role: found.role } as never;
        }
        if (email) recordAuthFailure(`login:${email}`);
        // Constant-time-ish padding: always hash-compare shaped work even on
        // miss would need a real user store; noted for the DB-auth migration.
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in (user as unknown as object)) token.role = ((user as unknown) as { role: string }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = (token.role as string) ?? "customer";
      return session;
    },
  },
  pages: { signIn: "/account/sign-in" },
};

export function isStaff(role?: string): boolean {
  return STAFF_ROLES.includes(role ?? "");
}

export function canAdminister(role?: string): boolean {
  return ["owner", "admin", "booking_manager"].includes(role ?? "");
}

// Per-action least privilege. Every mutating admin API checks the narrow
// action it performs — a support/analyst session can view dashboards (layout
// gate) but cannot change anything, and refunds need owner/admin.
export type AdminAction =
  | "fleet:write"
  | "pricing:write"
  | "coupons:write"
  | "bookings:write"
  | "maintenance:write"
  | "documents:review"
  | "refunds:write"
  | "reviews:write"
  | "staff:write";

const POLICY: Record<AdminAction, string[]> = {
  "fleet:write": ["owner", "admin", "fleet_manager"],
  "pricing:write": ["owner", "admin"],
  "coupons:write": ["owner", "admin", "booking_manager"],
  "bookings:write": ["owner", "admin", "booking_manager"],
  "maintenance:write": ["owner", "admin", "fleet_manager"],
  "documents:review": ["owner", "admin", "document_reviewer"],
  "refunds:write": ["owner", "admin"],
  "reviews:write": ["owner", "admin"],
  "staff:write": ["owner"],
};

export function can(action: AdminAction, role?: string): boolean {
  return (POLICY[action] ?? []).includes(role ?? "");
}
