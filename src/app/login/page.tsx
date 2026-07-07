"use client";

import { useActionState, useState } from "react";
import { signIn } from "./actions";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

export default function LoginPage() {
  const [state, action, pending] = useActionState<{ error: string | null }, FormData>(signIn, { error: null });
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <Logo size={56} align="center" />

      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <StripeBar />
        <form action={action} className="space-y-4 p-8">
          <div>
            <h1 className="text-lg font-semibold text-ink">Memo &amp; Document Tracking</h1>
            <p className="text-sm text-ink-muted">Sign in with your institutional account.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ecowas-green focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ecowas-green focus:outline-none"
            />
          </div>

          {state.error ? <p className="text-sm text-ecowas-deep-red">{state.error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white hover:bg-ecowas-green-dark disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      {DEMO_ACCOUNTS.length > 0 ? (
        <div className="w-full max-w-sm text-sm">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="text-ecowas-green hover:text-ecowas-green-dark"
          >
            {showDemo ? "Hide demo accounts" : "Show demo accounts"}
          </button>
          {showDemo ? (
            <ul className="mt-2 space-y-1.5 rounded-lg border border-border bg-surface p-3 text-xs text-ink-muted">
              {DEMO_ACCOUNTS.map((acct) => (
                <li key={acct.email} className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{acct.role}</span>
                  <span className="font-mono">{acct.email}</span>
                </li>
              ))}
              <li className="pt-1 text-ink">
                Password for all demo accounts: <span className="font-mono font-medium">{DEMO_ACCOUNTS[0].password}</span>
              </li>
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
