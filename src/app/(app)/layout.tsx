import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { signOut } from "./actions";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";
import { SidebarNav } from "@/components/sidebar-nav";
import { IconLogout } from "@/components/icons";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="p-4">
          <Logo size={36} />
        </div>
        <StripeBar />
        <SidebarNav />
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium text-ink">{profile.full_name}</p>
          {profile.on_leave ? (
            <span className="mt-1 inline-block rounded bg-ecowas-yellow/30 px-2 py-0.5 text-xs font-medium text-ecowas-brown">
              On leave — read only
            </span>
          ) : null}
          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ecowas-green"
            >
              <IconLogout className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
