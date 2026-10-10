import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authLockedOut, clearAuthFailures, recordAuthFailure } from "./rateLimit";

// Production refuses to boot without a real session secret — demo fallback
// is development-only.
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET must be set in production.");
}

// Demo auth: two seeded accounts (owner + customer) for local preview.
// Production: set AUTH_ALLOW_DEMO!=="true" (default) and these logins are
// rejected — wire Email/OAuth + hashed DB users instead. Role checks below
// remain the enforcement point.

const DEMO_ALLOW = process.env.AUTH_ALLOW_DEMO === "true" || process.env.NODE_ENV !== "production";

export const DEMO_USERS = [
  { id: "demo-owner", email: "owner@hartleyandmoor.example", password: process.env.DEMO_OWNER_PASSWORD ?? "owner1234", name: "M. Hartley", role: "owner" },
  { id: "demo-customer", email: "customer@example.com", password: process.env.DEMO_CUSTOMER_PASSWORD ?? "customer1234", name: "Demo Traveller", role: "customer" },
];

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
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
      async authorize(credentials) {
        if (!DEMO_ALLOW) return null;
        const email = (credentials?.email ?? "").toLowerCase().trim().slice(0, 120);
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
  return ["owner", "admin", "booking_manager", "fleet_manager", "document_reviewer", "support", "analyst"].includes(role ?? "");
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
  | "staff:write";

const POLICY: Record<AdminAction, string[]> = {
  "fleet:write": ["owner", "admin", "fleet_manager"],
  "pricing:write": ["owner", "admin"],
  "coupons:write": ["owner", "admin", "booking_manager"],
  "bookings:write": ["owner", "admin", "booking_manager"],
  "maintenance:write": ["owner", "admin", "fleet_manager"],
  "documents:review": ["owner", "admin", "document_reviewer"],
  "refunds:write": ["owner", "admin"],
  "staff:write": ["owner"],
};

export function can(action: AdminAction, role?: string): boolean {
  return (POLICY[action] ?? []).includes(role ?? "");
}
