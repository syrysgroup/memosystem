"use server";

import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export type SetPasswordState = { error: string | null; success: boolean };

export async function setNewPassword(
  _prevState: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const dict = await getDictionary();

  if (password.length < 8) {
    return { error: dict.passwordReset.passwordTooShort, success: false };
  }
  if (password !== confirmPassword) {
    return { error: dict.passwordReset.passwordsDontMatch, success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message, success: false };
  }

  return { error: null, success: true };
}
