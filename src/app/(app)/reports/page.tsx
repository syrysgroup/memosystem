import Link from "next/link";
import { getOrgUnits, getVisibleDocumentsForReports } from "@/lib/data";
import { StatusBadge, DaysBadge, OVERDUE_THRESHOLD_DAYS } from "@/components/badges";
import type { DocumentStatus } from "@/lib/supabase/types";

const STATUS_ORDER: DocumentStatus[] = [
  "draft",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "dispatched",
  "closed",
];

export default async function ReportsPage() {
  const [documents, orgUnits] = await Promise.all([getVisibleDocumentsForReports(), getOrgUnits()]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;

  const openDocuments = documents.filter((d) => d.status !== "closed" && d.status !== "dispatched");
  const overdue = openDocuments
    .filter((d) => (d.days_in_current_office ?? 0) >= OVERDUE_THRESHOLD_DAYS)
    .sort((a, b) => (b.days_in_current_office ?? 0) - (a.days_in_current_office ?? 0));

  const statusCounts = new Map<DocumentStatus, number>();
  for (const d of documents) {
    statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1);
  }

  const byOffice = new Map<string, { count: number; totalDays: number }>();
  for (const d of openDocuments) {
    const entry = byOffice.get(d.current_org_unit_id) ?? { count: 0, totalDays: 0 };
    entry.count += 1;
    entry.totalDays += d.days_in_current_office ?? 0;
    byOffice.set(d.current_org_unit_id, entry);
  }
  const officeRows = [...byOffice.entries()]
    .map(([orgUnitId, { count, totalDays }]) => ({
      orgUnitId,
      count,
      avgDays: count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.avgDays - a.avgDays);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">
          Scoped to what you can see: your office and everything beneath it (or everything, for admins).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {STATUS_ORDER.map((s) => (
          <div key={s} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-semibold text-slate-900">{statusCounts.get(s) ?? 0}</p>
            <div className="mt-1">
              <StatusBadge status={s} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Overdue (&ge; {OVERDUE_THRESHOLD_DAYS} days in current office)
        </h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing overdue right now.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Currently at</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Days here</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`/documents/${d.id}`} className="underline">
                      {d.reference_code}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{d.title}</td>
                  <td className="px-3 py-2 text-slate-500">{d.current_org_unit_name}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-3 py-2">
                    <DaysBadge days={d.days_in_current_office} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Open documents by office</h2>
        {officeRows.length === 0 ? (
          <p className="text-sm text-slate-400">No open documents in view.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Office</th>
                <th className="px-3 py-2">Open documents</th>
                <th className="px-3 py-2">Average days in office</th>
              </tr>
            </thead>
            <tbody>
              {officeRows.map((row) => (
                <tr key={row.orgUnitId} className="border-t border-slate-100">
                  <td className="px-3 py-2">{orgUnitName(row.orgUnitId)}</td>
                  <td className="px-3 py-2">{row.count}</td>
                  <td className="px-3 py-2">{row.avgDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
