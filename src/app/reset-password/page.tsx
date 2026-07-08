import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";

export default async function ResetPasswordPage() {
  const dict = await getDictionary();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-4 py-10">
        <Logo size={56} align="center" />
        <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <StripeBar />
          <div className="space-y-4 p-8 text-center">
            <p className="text-sm text-ecowas-deep-red">{dict.passwordReset.invalidOrExpiredLink}</p>
            <Link href="/forgot-password" className="text-sm text-ecowas-green hover:text-ecowas-green-dark">
              {dict.passwordReset.forgotTitle}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm dict={dict.passwordReset} />;
}
