import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { LoginForm } from "@/components/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function LoginPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <div className="relative">
      <LanguageSwitcher current={locale} className="absolute right-4 top-4 z-10" />
      <LoginForm dict={dict.login} />
    </div>
  );
}
