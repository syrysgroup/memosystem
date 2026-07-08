import {
  getActiveDelegationsForPositions,
  getActivePositionsForOrgUnits,
  getAllPositions,
  getCurrentProfile,
  getMyActivePositions,
  getOrgUnitDescendantIds,
  getOrgUnits,
  getPositionTypes,
  getStaffDirectory,
} from "@/lib/data";
import { assignDelegation, createPosition, endDelegation, endPosition, setLeaveStatus } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { roleLabel } from "@/lib/labels";
import { AddStaffForm } from "@/components/add-staff-form";

export default async function TeamPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const [myPositions, orgUnits, staff, positionTypes] = await Promise.all([
    getMyActivePositions(profile.id),
    getOrgUnits(),
    getStaffDirectory(),
    getPositionTypes(),
  ]);
  // institutionWideCount is a function -- can't cross into the
  // AddStaffForm Client Component, so it's picked out explicitly rather
  // than passing dict.team whole (see add-staff-form.tsx).
  const addStaffDict = {
    addStaffTitle: dict.team.addStaffTitle,
    addStaffSubtitle: dict.team.addStaffSubtitle,
    fullNameLabel: dict.team.fullNameLabel,
    emailLabel: dict.team.emailLabel,
    roleStaff: dict.team.roleStaff,
    roleOfficeManager: dict.team.roleOfficeManager,
    roleHead: dict.team.roleHead,
    positionTemplateLabel: dict.team.positionTemplateLabel,
    positionTemplateNone: dict.team.positionTemplateNone,
    gradeLabel: dict.team.gradeLabel,
    gradePlaceholder: dict.team.gradePlaceholder,
    createAccount: dict.team.createAccount,
    tempPasswordLabel: dict.team.tempPasswordLabel,
    tempPasswordNote: dict.team.tempPasswordNote,
  };

  const overseeingPositions = (profile.is_admin || profile.is_org_admin)
    ? myPositions
    : myPositions.filter((p) => p.role === "head" || p.role === "office_manager");

  let scopeOrgUnitIds: string[];
  if ((profile.is_admin || profile.is_org_admin)) {
    scopeOrgUnitIds = orgUnits.map((ou) => ou.id);
  } else {
    const scopeSets = await Promise.all(overseeingPositions.map((p) => getOrgUnitDescendantIds(p.org_unit_id)));
    scopeOrgUnitIds = [...new Set(scopeSets.flat())];
  }

  const canManage = (profile.is_admin || profile.is_org_admin) || overseeingPositions.length > 0;
  const positions = canManage ? await getActivePositionsForOrgUnits(scopeOrgUnitIds) : [];
  const delegations = canManage ? await getActiveDelegationsForPositions(positions.map((p) => p.id)) : [];

  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const profileName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;
  const positionLabel = (id: string) => {
    const p = positions.find((x) => x.id === id) ?? myPositions.find((x) => x.id === id);
    if (!p) return id;
    return `${profileName(p.profile_id)} (${roleLabel(p.role, dict)} — ${orgUnitName(p.org_unit_id)})`;
  };

  if (!canManage) {
    return <p className="text-sm text-ink-muted">{dict.team.noScope}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">{dict.team.title}</h1>
        <p className="text-sm text-ink-muted">{dict.team.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2">{dict.team.colPerson}</th>
              <th className="px-4 py-2">{dict.team.colOffice}</th>
              <th className="px-4 py-2">{dict.team.colRole}</th>
              <th className="px-4 py-2">{dict.team.colStatus}</th>
              <th className="px-4 py-2">{dict.team.colLeave}</th>
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
                    {roleLabel(p.role, dict)}
                    {p.named_role ? ` (${p.named_role})` : ""}
                  </td>
                  <td className="px-4 py-2">
                    {person?.on_leave ? (
                      <span className="rounded bg-ecowas-yellow/25 px-2 py-0.5 text-xs font-medium text-ecowas-brown">
                        {person.leave_end ? dict.team.onLeaveUntil.replace("{date}", person.leave_end) : dict.directory.onLeave}
                      </span>
                    ) : (
                      <span className="text-ink-muted">{dict.team.active}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <form action={setLeaveStatus} className="flex flex-wrap items-center gap-1">
                      <input type="hidden" name="profile_id" value={p.profile_id} />
                      <input type="date" name="leave_start" defaultValue={person?.leave_start ?? ""} className="rounded border border-border px-1 py-0.5 text-xs" />
                      <input type="date" name="leave_end" defaultValue={person?.leave_end ?? ""} className="rounded border border-border px-1 py-0.5 text-xs" />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="on_leave" defaultChecked={person?.on_leave} /> {dict.team.leaveCheckbox}
                      </label>
                      <button type="submit" className="rounded border border-border px-2 py-0.5 text-xs font-medium hover:bg-ecowas-green-tint">
                        {dict.common.save}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={endPosition}>
                      <input type="hidden" name="position_id" value={p.id} />
                      <button type="submit" className="text-xs font-medium text-ecowas-deep-red underline">
                        {dict.team.endPosition}
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
          <h2 className="text-sm font-semibold text-ink">{dict.team.assignNewPosition}</h2>
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
            <option value="staff">{dict.team.roleStaff}</option>
            <option value="office_manager">{dict.team.roleOfficeManager}</option>
            <option value="head">{dict.team.roleHead}</option>
          </select>
          <div>
            <label className="text-xs text-ink-muted">{dict.team.positionTemplateLabel}</label>
            <select name="position_type_id" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
              <option value="">{dict.team.positionTemplateNone}</option>
              {orgUnits
                .filter((ou) => scopeOrgUnitIds.includes(ou.id))
                .map((ou) => {
                  const types = positionTypes.filter((pt) => pt.org_unit_id === ou.id);
                  if (types.length === 0) return null;
                  return (
                    <optgroup key={ou.id} label={ou.name}>
                      {types.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.title}
                          {pt.grade_band.length > 0 ? ` (${pt.grade_band.join("/")})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
            </select>
          </div>
          <input name="grade" placeholder={dict.team.gradePlaceholder} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            {dict.common.assign}
          </button>
        </form>

        <form action={assignDelegation} className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">{dict.team.assignDelegate}</h2>
          <p className="text-xs text-ink-muted">{dict.team.delegateNote}</p>
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
            {dict.common.assign}
          </button>
        </form>
      </div>

      {profile.is_admin || profile.is_org_admin ? (
        <AddStaffForm orgUnits={orgUnits} positionTypes={positionTypes} dict={addStaffDict} />
      ) : null}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.team.activeDelegations}</h2>
        {delegations.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.team.noneRightNow}</p>
        ) : (
          <ul className="space-y-2">
            {delegations.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span>
                  {positionLabel(d.delegate_position_id)} {dict.team.actingFor} {positionLabel(d.original_position_id)}
                  <span className="block text-xs text-ink-muted">
                    {d.start_date} → {d.end_date}
                  </span>
                </span>
                <form action={endDelegation}>
                  <input type="hidden" name="delegation_id" value={d.id} />
                  <button type="submit" className="text-xs font-medium text-ecowas-deep-red underline">
                    {dict.team.endNow}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AllPositionsHint isAdmin={(profile.is_admin || profile.is_org_admin)} dict={dict} />
    </div>
  );
}

async function AllPositionsHint({ isAdmin, dict }: { isAdmin: boolean; dict: Dictionary }) {
  if (!isAdmin) return null;
  const all = await getAllPositions();
  return <p className="text-xs text-ink-muted">{dict.team.institutionWideCount(all.length)}</p>;
}
