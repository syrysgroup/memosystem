import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { signOut } from "./actions";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";
import { SidebarNav } from "@/components/sidebar-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { IconLogout } from "@/components/icons";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="p-4">
          <Logo size={36} />
        </div>
        <StripeBar />
        <SidebarNav nav={dict.nav} />
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium text-ink">{profile.full_name}</p>
          {profile.on_leave ? (
            <span className="mt-1 inline-block rounded bg-ecowas-yellow/30 px-2 py-0.5 text-xs font-medium text-ecowas-brown">
              {dict.common.onLeaveReadOnly}
            </span>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <LanguageSwitcher current={locale} />
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ecowas-green"
              >
                <IconLogout className="h-4 w-4" />
                {dict.common.signOut}
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
