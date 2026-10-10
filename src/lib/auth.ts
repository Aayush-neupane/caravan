import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
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
  { id: "demo-owner", email: "owner@wattleandwander.com.au", password: process.env.DEMO_OWNER_PASSWORD ?? "owner1234", name: "M. Wattle", role: "owner" },
];

export const authOptions: NextAuthOptions = {
  // 1h limits revocation lag on shared ops machines; staff re-auth daily.
  session: { strategy: "jwt", maxAge: 3600 },
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
        const password = credentials?.password ?? "";
        // DB users first (bcrypt-hashed). Falls through to demo only when
        // no DB match exists.
        try {
          if (email && password) {
            const dbUser = await prisma.user.findUnique({ where: { email } });
            if (dbUser?.passwordHash) {
              const ok = await bcrypt.compare(password, dbUser.passwordHash);
              if (ok) {
                clearAuthFailures(`login:${email}`);
                return { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role } as never;
              }
            } else {
              // Uniform work factor on miss so DB-hit vs miss timing does
              // not oracle account existence.
              await bcrypt.compare(password, "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
            }
          }
        } catch {
          /* DB unavailable — fall through to demo/failure path */
        }
        if (!DEMO_ALLOW) {
          if (email) recordAuthFailure(`login:${email}`);
          return null;
        }
        const found = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email && u.password === password
        );
        if (found) {
          if (email) clearAuthFailures(`login:${email}`);
          return { id: found.id, email: found.email, name: found.name, role: found.role } as never;
        }
        if (email) recordAuthFailure(`login:${email}`);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).id = (user as unknown as { id: string }).id;
        if ("role" in (user as unknown as object)) token.role = ((user as unknown) as { role: string }).role;
      }
      // Refresh role (and id) from DB so demotions apply without re-login.
      // Falls back to the existing token role when the DB is unreachable.
      try {
        const email = ((token.email as string | undefined) ?? "").toLowerCase().trim();
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            token.role = dbUser.role;
            (token as Record<string, unknown>).id = dbUser.id;
          }
        }
      } catch {
        /* keep token.role as-is */
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = (token.role as string) ?? "customer";
        (session.user as unknown as { id?: unknown }).id = (token as Record<string, unknown>).id;
      }
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
