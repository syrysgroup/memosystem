"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// supabase-js falls back to JSON.stringify(body) for its error message when
// an Auth API response doesn't have a msg/message/error_description/error
// field (e.g. a bare 500 with an empty body) — surfacing something like the
// literal string "{}" to the user. Never show that kind of message verbatim.
function toUserMessage(message: string, genericError: string): string {
  const trimmed = message.trim();
  if (!trimmed || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return genericError;
  }
  return trimmed;
}

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const dict = await getDictionary();

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("signIn: Supabase auth error", error);
      return { error: toUserMessage(error.message, dict.login.genericError) };
    }
  } catch (error) {
    console.error("signIn: unexpected error", error);
    return { error: dict.login.genericError };
  }

  redirect("/dashboard");
}
