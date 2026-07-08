import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const dict = await getDictionary();
  return <ForgotPasswordForm dict={dict.passwordReset} />;
}
