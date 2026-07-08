"use client";

import { useActionState } from "react";
import Link from "next/link";
import { setNewPassword, type SetPasswordState } from "@/app/reset-password/actions";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";
import type { Dictionary } from "@/lib/i18n/dictionary";

const initialState: SetPasswordState = { error: null, success: false };

export function ResetPasswordForm({ dict }: { dict: Dictionary["passwordReset"] }) {
  const [state, formAction, pending] = useActionState(setNewPassword, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
      <Logo size={56} align="center" />
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <StripeBar />
        <form action={formAction} className="space-y-4 p-8">
          <div>
            <h1 className="text-lg font-semibold text-ink">{dict.resetTitle}</h1>
            <p className="text-sm text-ink-muted">{dict.resetSubtitle}</p>
          </div>

          {state.success ? (
            <>
              <p className="text-sm text-ecowas-green">{dict.resetSuccess}</p>
              <Link href="/login" className="block text-center text-sm text-ecowas-green hover:text-ecowas-green-dark">
                {dict.backToLogin}
              </Link>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-ink">
                  {dict.newPasswordLabel}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ecowas-green focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="confirm_password" className="text-sm font-medium text-ink">
                  {dict.confirmPasswordLabel}
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-ecowas-green focus:outline-none"
                />
              </div>

              {state.error ? <p className="text-sm text-ecowas-deep-red">{state.error}</p> : null}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white hover:bg-ecowas-green-dark disabled:opacity-60"
              >
                {dict.setPassword}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
