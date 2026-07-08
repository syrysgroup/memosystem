"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type RequestPasswordResetState } from "@/app/forgot-password/actions";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: RequestPasswordResetState = { submitted: false };

export function ForgotPasswordForm({ dict }: { dict: Dictionary["passwordReset"] }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <Logo size={56} align="center" />
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <StripeBar />
        <form action={formAction} className="space-y-4 p-8">
          <div>
            <h1 className="text-lg font-semibold text-ink">{dict.forgotTitle}</h1>
            <p className="text-sm text-ink-muted">{dict.forgotSubtitle}</p>
          </div>

          {state.submitted ? (
            <p className="text-sm text-ecowas-green">{dict.checkEmailNote}</p>
          ) : (
            <>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-ink">
                  {dict.emailLabel}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ecowas-green focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white hover:bg-ecowas-green-dark disabled:opacity-60"
              >
                {dict.sendResetLink}
              </button>
            </>
          )}

          <Link href="/login" className="block text-center text-sm text-ecowas-green hover:text-ecowas-green-dark">
            {dict.backToLogin}
          </Link>
        </form>
      </div>
    </div>
  );
}
