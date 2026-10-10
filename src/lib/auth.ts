import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!DEMO_ALLOW) return null;
        const found = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === (credentials?.email ?? "").toLowerCase() && u.password === credentials?.password
        );
        if (found) return { id: found.id, email: found.email, name: found.name, role: found.role } as never;
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
