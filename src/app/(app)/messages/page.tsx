import Link from "next/link";
import { getCurrentProfile, getMyChannelOrgUnitIds, getOrgUnits, getStaffDirectory } from "@/lib/data";

export default async function MessagesIndexPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [channelIds, orgUnits, staff] = await Promise.all([
    getMyChannelOrgUnitIds(profile.id),
    getOrgUnits(),
    getStaffDirectory(),
  ]);
  const channels = orgUnits.filter((ou) => channelIds.includes(ou.id));

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Office channels</h2>
        {channels.length === 0 ? (
          <p className="text-sm text-slate-400">You don&rsquo;t hold a Position yet, so no channels are available.</p>
        ) : (
          <ul className="space-y-1">
            {channels.map((c) => (
              <li key={c.id}>
                <Link href={`/messages/office/${c.id}`} className="block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  # {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Direct messages</h2>
        <ul className="space-y-1">
          {staff
            .filter((s) => s.id !== profile.id)
            .map((s) => (
              <li key={s.id}>
                <Link href={`/messages/dm/${s.id}`} className="block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  {s.full_name}
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
