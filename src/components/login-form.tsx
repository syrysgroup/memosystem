"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function LoginForm({ dict }: { dict: Dictionary["login"] }) {
  const [state, action, pending] = useActionState<{ error: string | null }, FormData>(signIn, { error: null });
  const [showDemo, setShowDemo] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillDemo(acct: { email: string; password: string }) {
    if (emailRef.current) emailRef.current.value = acct.email;
    if (passwordRef.current) passwordRef.current.value = acct.password;
    setSelectedEmail(acct.email);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <Logo size={56} align="center" />

      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <StripeBar />
        <form action={action} className="space-y-4 p-8">
          <div>
            <h1 className="text-lg font-semibold text-ink">{dict.appTagline}</h1>
            <p className="text-sm text-ink-muted">{dict.subtitle}</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              {dict.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              ref={emailRef}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ecowas-green focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              {dict.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              ref={passwordRef}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ecowas-green focus:outline-none"
            />
          </div>

          {state.error ? <p className="text-sm text-ecowas-deep-red">{state.error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white hover:bg-ecowas-green-dark disabled:opacity-60"
          >
            {pending ? dict.signingIn : dict.signIn}
          </button>

          <Link href="/forgot-password" className="block text-center text-sm text-ecowas-green hover:text-ecowas-green-dark">
            {dict.forgotPasswordLink}
          </Link>
        </form>
      </div>

      {DEMO_ACCOUNTS.length > 0 ? (
        <div className="w-full max-w-md text-sm">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="mx-auto block text-ecowas-green hover:text-ecowas-green-dark"
          >
            {showDemo ? dict.hideDemo : dict.showDemo}
          </button>
          {showDemo ? (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((acct) => {
                  const selected = selectedEmail === acct.email;
                  return (
                    <button
                      key={acct.email}
                      type="button"
                      onClick={() => fillDemo(acct)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        selected
                          ? "border-ecowas-green bg-ecowas-green-tint"
                          : "border-border bg-surface hover:border-ecowas-green hover:bg-ecowas-green-tint"
                      }`}
                    >
                      <div className="text-sm font-semibold text-ink">{acct.role}</div>
                      <div className="mt-0.5 truncate font-mono text-xs text-ink-muted">{acct.email}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-ink-muted">{dict.demoHint}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
