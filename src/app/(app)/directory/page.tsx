import { getAllPositions, getAvatarUrl, getOrgUnits, getStaffDirectory } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { roleLabel } from "@/lib/labels";
import { Avatar } from "@/components/avatar";

export default async function DirectoryPage() {
  const dict = await getDictionary();
  const [staff, positions, orgUnits] = await Promise.all([getStaffDirectory(), getAllPositions(), getOrgUnits()]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const currentPositions = positions.filter((p) => !p.end_date);
  const avatarUrls = await Promise.all(staff.map((s) => getAvatarUrl(s.avatar_path)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">{dict.directory.title}</h1>
        <p className="text-sm text-ink-muted">{dict.directory.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">{dict.directory.colName}</th>
              <th className="px-4 py-2">{dict.directory.colEmail}</th>
              <th className="px-4 py-2">{dict.profile.phoneLabel}</th>
              <th className="px-4 py-2">{dict.directory.colPositions}</th>
              <th className="px-4 py-2">{dict.directory.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => {
              const myPositions = currentPositions.filter((p) => p.profile_id === s.id);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Avatar name={s.full_name} size={32} photoUrl={avatarUrls[i]} />
                  </td>
                  <td className="px-4 py-2">{s.full_name}</td>
                  <td className="px-4 py-2 text-ink-muted">{s.email}</td>
                  <td className="px-4 py-2 text-ink-muted">{s.phone_number ?? dict.common.dash}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {myPositions.length === 0
                      ? dict.common.dash
                      : myPositions.map((p) => `${roleLabel(p.role, dict)} @ ${orgUnitName(p.org_unit_id)}`).join(", ")}
                  </td>
                  <td className="px-4 py-2">
                    {s.on_leave ? (
                      <span className="rounded bg-ecowas-yellow/25 px-2 py-0.5 text-xs font-medium text-ecowas-brown">{dict.directory.onLeave}</span>
                    ) : (
                      <span className="text-ink-muted">{dict.directory.active}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
