import { getAllPositions, getOrgUnits, getStaffDirectory } from "@/lib/data";

export default async function DirectoryPage() {
  const [staff, positions, orgUnits] = await Promise.all([getStaffDirectory(), getAllPositions(), getOrgUnits()]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const currentPositions = positions.filter((p) => !p.end_date);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Staff Directory</h1>
        <p className="text-sm text-ink-muted">Organization-wide contact list and current positions.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Current position(s)</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const myPositions = currentPositions.filter((p) => p.profile_id === s.id);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2">{s.full_name}</td>
                  <td className="px-4 py-2 text-ink-muted">{s.email}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {myPositions.length === 0
                      ? "—"
                      : myPositions.map((p) => `${p.role} @ ${orgUnitName(p.org_unit_id)}`).join(", ")}
                  </td>
                  <td className="px-4 py-2">
                    {s.on_leave ? (
                      <span className="rounded bg-ecowas-yellow/25 px-2 py-0.5 text-xs font-medium text-ecowas-brown">On leave</span>
                    ) : (
                      <span className="text-ink-muted">Active</span>
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
