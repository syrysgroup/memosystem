import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { signOut } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="text-slate-900">
              Dashboard
            </Link>
            <Link href="/documents/new">New Document</Link>
            <Link href="/registry">Registry</Link>
            <Link href="/directory">Directory</Link>
            <Link href="/team">My Team</Link>
          </nav>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>
              {profile.full_name}
              {profile.on_leave ? (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  On leave — read only
                </span>
              ) : null}
            </span>
            <form action={signOut}>
              <button type="submit" className="text-slate-500 hover:text-slate-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
