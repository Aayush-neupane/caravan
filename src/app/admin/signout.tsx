"use client";

import { signOut } from "next-auth/react";

export function AdminSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full border border-white/25 px-3 py-2 text-left text-[0.83rem] font-semibold text-paper/85 hover:border-white/60 hover:text-white"
      style={{ borderRadius: 6 }}
    >
      Sign out →
    </button>
  );
}
