"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type RequestPasswordResetState = { submitted: boolean };

export async function requestPasswordReset(
  _prevState: RequestPasswordResetState,
  formData: FormData
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { submitted: false };

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const redirectTo = `${proto}://${host}/reset-password`;

  const supabase = await createClient();
  // Always report success regardless of whether the address matches an
  // account -- letting this form confirm which emails have accounts would
  // be an enumeration leak on a public, unauthenticated endpoint.
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  return { submitted: true };
}
