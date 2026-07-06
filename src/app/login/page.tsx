"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<{ error: string | null }, FormData>(signIn, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Memo &amp; Document Tracking</h1>
          <p className="text-sm text-slate-500">Sign in with your institutional account.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
