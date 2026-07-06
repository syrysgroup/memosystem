import { getOrgUnits, getStaffDirectory } from "@/lib/data";

export default async function DirectoryPage() {
  const [staff, orgUnits] = await Promise.all([getStaffDirectory(), getOrgUnits()]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Staff Directory</h1>
        <p className="text-sm text-slate-500">Organization-wide contact list.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Office</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{s.full_name}</td>
                <td className="px-4 py-2 text-slate-500">{orgUnitName(s.org_unit_id)}</td>
                <td className="px-4 py-2 text-slate-500">{s.role}</td>
                <td className="px-4 py-2 text-slate-500">{s.email}</td>
                <td className="px-4 py-2">
                  {s.on_leave ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">On leave</span>
                  ) : (
                    <span className="text-slate-400">Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
