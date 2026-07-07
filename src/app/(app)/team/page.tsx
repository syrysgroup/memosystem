import {
  getActiveDelegationsForPositions,
  getActivePositionsForOrgUnits,
  getAllPositions,
  getCurrentProfile,
  getMyActivePositions,
  getOrgUnitDescendantIds,
  getOrgUnits,
  getStaffDirectory,
} from "@/lib/data";
import { assignDelegation, createPosition, endDelegation, endPosition, setLeaveStatus } from "./actions";

export default async function TeamPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [myPositions, orgUnits, staff] = await Promise.all([
    getMyActivePositions(profile.id),
    getOrgUnits(),
    getStaffDirectory(),
  ]);

  const overseeingPositions = profile.is_admin
    ? myPositions
    : myPositions.filter((p) => p.role === "head" || p.role === "office_manager");

  let scopeOrgUnitIds: string[];
  if (profile.is_admin) {
    scopeOrgUnitIds = orgUnits.map((ou) => ou.id);
  } else {
    const scopeSets = await Promise.all(overseeingPositions.map((p) => getOrgUnitDescendantIds(p.org_unit_id)));
    scopeOrgUnitIds = [...new Set(scopeSets.flat())];
  }

  const canManage = profile.is_admin || overseeingPositions.length > 0;
  const positions = canManage ? await getActivePositionsForOrgUnits(scopeOrgUnitIds) : [];
  const delegations = canManage ? await getActiveDelegationsForPositions(positions.map((p) => p.id)) : [];

  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const profileName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;
  const positionLabel = (id: string) => {
    const p = positions.find((x) => x.id === id) ?? myPositions.find((x) => x.id === id);
    if (!p) return id;
    return `${profileName(p.profile_id)} (${p.role} — ${orgUnitName(p.org_unit_id)})`;
  };

  if (!canManage) {
    return (
      <p className="text-sm text-ink-muted">
        You don&rsquo;t currently oversee any office (only Head/Office Manager positions do), so there&rsquo;s nothing to
        manage here.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">My Team</h1>
        <p className="text-sm text-ink-muted">Positions across your oversight scope, leave status, and delegations.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2">Person</th>
              <th className="px-4 py-2">Office</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Leave</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => {
              const person = staff.find((s) => s.id === p.profile_id);
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2">{person?.full_name ?? p.profile_id}</td>
                  <td className="px-4 py-2 text-ink-muted">{orgUnitName(p.org_unit_id)}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {p.role}
                    {p.named_role ? ` (${p.named_role})` : ""}
                  </td>
                  <td className="px-4 py-2">
                    {person?.on_leave ? (
                      <span className="rounded bg-ecowas-yellow/25 px-2 py-0.5 text-xs font-medium text-ecowas-brown">
                        On leave{person.leave_end ? ` until ${person.leave_end}` : ""}
                      </span>
                    ) : (
                      <span className="text-ink-muted">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <form action={setLeaveStatus} className="flex flex-wrap items-center gap-1">
                      <input type="hidden" name="profile_id" value={p.profile_id} />
                      <input type="date" name="leave_start" defaultValue={person?.leave_start ?? ""} className="rounded border border-border px-1 py-0.5 text-xs" />
                      <input type="date" name="leave_end" defaultValue={person?.leave_end ?? ""} className="rounded border border-border px-1 py-0.5 text-xs" />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="on_leave" defaultChecked={person?.on_leave} /> Leave
                      </label>
                      <button type="submit" className="rounded border border-border px-2 py-0.5 text-xs font-medium hover:bg-ecowas-green-tint">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={endPosition}>
                      <input type="hidden" name="position_id" value={p.id} />
                      <button type="submit" className="text-xs font-medium text-ecowas-deep-red underline">
                        End position
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={createPosition} className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Assign a new Position</h2>
          <select name="profile_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <select name="org_unit_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
            {orgUnits
              .filter((ou) => scopeOrgUnitIds.includes(ou.id))
              .map((ou) => (
                <option key={ou.id} value={ou.id}>
                  {ou.name}
                </option>
              ))}
          </select>
          <select name="role" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
            <option value="staff">Staff</option>
            <option value="office_manager">Office Manager</option>
            <option value="head">Head</option>
          </select>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            Assign
          </button>
        </form>

        <form action={assignDelegation} className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Assign a delegate</h2>
          <p className="text-xs text-ink-muted">All-or-nothing per Position — the delegate takes over everything currently held by the absent position.</p>
          <select name="original_position_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {positionLabel(p.id)}
              </option>
            ))}
          </select>
          <select name="delegate_position_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {positionLabel(p.id)}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" name="start_date" required className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            <input type="date" name="end_date" required className="w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            Assign
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Active delegations</h2>
        {delegations.length === 0 ? (
          <p className="text-sm text-ink-muted">None right now.</p>
        ) : (
          <ul className="space-y-2">
            {delegations.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span>
                  {positionLabel(d.delegate_position_id)} acting for {positionLabel(d.original_position_id)}
                  <span className="block text-xs text-ink-muted">
                    {d.start_date} → {d.end_date}
                  </span>
                </span>
                <form action={endDelegation}>
                  <input type="hidden" name="delegation_id" value={d.id} />
                  <button type="submit" className="text-xs font-medium text-ecowas-deep-red underline">
                    End now
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AllPositionsHint isAdmin={profile.is_admin} />
    </div>
  );
}

async function AllPositionsHint({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;
  const all = await getAllPositions();
  return <p className="text-xs text-ink-muted">{all.length} position record(s) exist institution-wide.</p>;
}
