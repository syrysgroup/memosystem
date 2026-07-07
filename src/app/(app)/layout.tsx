import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { signOut } from "./actions";
import { Logo } from "@/components/logo";
import { StripeBar } from "@/components/stripe-bar";
import { NavLink } from "@/components/nav-link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="hidden text-sm font-medium text-ink-muted sm:inline">
              | Memo &amp; Document Tracking
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-ink-muted">
            <span>
              {profile.full_name}
              {profile.on_leave ? (
                <span className="ml-2 rounded bg-ecowas-yellow/30 px-2 py-0.5 text-xs font-medium text-ecowas-brown">
                  On leave — read only
                </span>
              ) : null}
            </span>
            <form action={signOut}>
              <button type="submit" className="text-ink-muted hover:text-ecowas-green">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <StripeBar />
        <nav className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-6 text-sm font-medium">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/documents/new">New Document</NavLink>
            <NavLink href="/registry">Registry</NavLink>
            <NavLink href="/messages">Messages</NavLink>
            <NavLink href="/reports">Reports</NavLink>
            <NavLink href="/directory">Directory</NavLink>
            <NavLink href="/team">My Team</NavLink>
            <NavLink href="/audit-grants">Audit Grants</NavLink>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
