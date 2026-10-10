"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@hartleyandmoor.example");
  const [password, setPassword] = useState("owner1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (r?.error) { setError("Invalid credentials. Try the demo accounts below."); return; }
    router.push("/admin");
  }

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <p className="tick-label">Sign in</p>
      <h1 className="mt-2 font-display text-4xl">Welcome back.</h1>
      <form onSubmit={submit} className="mt-6 border border-border bg-white p-6" style={{ borderRadius: 10 }}>
        <label className="field-label" htmlFor="s-email">Email</label>
        <input id="s-email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="field-label mt-4" htmlFor="s-pass">Password</label>
        <input id="s-pass" type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="field-error">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <div className="mt-4 border-t border-border pt-4 text-[0.82rem] text-muted">
          <p className="font-semibold text-charcoal">Demo accounts (seeded):</p>
          <p>Owner: owner@hartleyandmoor.example / owner1234</p>
          <p>Customer: customer@example.com / customer1234</p>
        </div>
      </form>
    </div>
  );
}
