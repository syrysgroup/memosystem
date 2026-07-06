import { getActiveDelegationsForUnits, getCurrentProfile, getOrgUnits, getTeamMembers } from "@/lib/data";
import { assignDelegation, endDelegation, setLeaveStatus } from "./actions";

export default async function TeamPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [members, orgUnits] = await Promise.all([getTeamMembers(profile.org_unit_id), getOrgUnits()]);
  const delegations = await getActiveDelegationsForUnits(members.map((m) => m.org_unit_id));
  const canManage = profile.role === "head" || profile.role === "admin";
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const memberName = (id: string) => members.find((m) => m.id === id)?.full_name ?? id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">My Team</h1>
        <p className="text-sm text-slate-500">
          Staff in your office and reporting line. Mark leave and assign a delegate so pending work keeps moving while someone is away.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Office</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              {canManage ? <th className="px-4 py-2">Leave</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{m.full_name}</td>
                <td className="px-4 py-2 text-slate-500">{orgUnitName(m.org_unit_id)}</td>
                <td className="px-4 py-2 text-slate-500">{m.role}</td>
                <td className="px-4 py-2">
                  {m.on_leave ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      On leave{m.leave_end ? ` until ${m.leave_end}` : ""}
                    </span>
                  ) : (
                    <span className="text-slate-400">Active</span>
                  )}
                </td>
                {canManage ? (
                  <td className="px-4 py-2">
                    <form action={setLeaveStatus} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="user_id" value={m.id} />
                      <input type="date" name="leave_start" defaultValue={m.leave_start ?? ""} className="rounded border border-slate-300 px-2 py-1 text-xs" />
                      <input type="date" name="leave_end" defaultValue={m.leave_end ?? ""} className="rounded border border-slate-300 px-2 py-1 text-xs" />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="on_leave" defaultChecked={m.on_leave} /> On leave
                      </label>
                      <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-xs font-medium">
                        Save
                      </button>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form action={assignDelegation} className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">Assign a delegate</h2>
            <div>
              <label className="text-sm font-medium text-slate-700">Absent staff member</label>
              <select name="absent_user_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Delegate (acting officer)</label>
              <select name="delegate_user_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Office covered</label>
              <select name="org_unit_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {[...new Set(members.map((m) => m.org_unit_id))].map((id) => (
                  <option key={id} value={id}>
                    {orgUnitName(id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Start date</label>
                <input type="date" name="start_date" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">End date</label>
                <input type="date" name="end_date" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Assign
            </button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Active delegations</h2>
            {delegations.length === 0 ? (
              <p className="text-sm text-slate-400">None right now.</p>
            ) : (
              <ul className="space-y-3">
                {delegations.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span>
                      {memberName(d.delegate_user_id)} acting for {memberName(d.absent_user_id)} in {orgUnitName(d.org_unit_id)}
                      <span className="block text-xs text-slate-400">
                        {d.start_date} → {d.end_date}
                      </span>
                    </span>
                    <form action={endDelegation}>
                      <input type="hidden" name="delegation_id" value={d.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 underline">
                        End now
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
