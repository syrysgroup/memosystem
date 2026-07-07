import {
  getCurrentProfile,
  getMyActivePositions,
  getOrgUnits,
  getReportingLineDrilldown,
  getReportingLineSummary,
} from "@/lib/data";
import { DaysBadge } from "@/components/badges";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ org_unit_id?: string }>;
}) {
  const { org_unit_id } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const [myPositions, orgUnits] = await Promise.all([getMyActivePositions(profile.id), getOrgUnits()]);
  const overseeableOrgUnits = profile.is_admin || profile.is_org_admin
    ? orgUnits
    : orgUnits.filter((ou) => myPositions.some((p) => p.org_unit_id === ou.id && (p.role === "head" || p.role === "office_manager")));

  if (overseeableOrgUnits.length === 0) {
    return <p className="text-sm text-ink-muted">{dict.reports.noScope}</p>;
  }

  const rootOrgUnitId = org_unit_id && overseeableOrgUnits.some((ou) => ou.id === org_unit_id)
    ? org_unit_id
    : overseeableOrgUnits[0].id;

  const [summary, drilldown] = await Promise.all([
    getReportingLineSummary(rootOrgUnitId),
    getReportingLineDrilldown(rootOrgUnitId),
  ]);

  const buckets = ["0-3", "4-7", "8+"];
  const countFor = (bucket: string, tag: string) =>
    summary.filter((s) => s.bucket === bucket && s.tag === tag).reduce((sum, s) => sum + s.doc_count, 0);
  const newlyInheritedCount = summary.filter((s) => s.newly_inherited).reduce((sum, s) => sum + s.doc_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">{dict.reports.title}</h1>
        <p className="text-sm text-ink-muted">{dict.reports.subtitle}</p>
      </div>

      {overseeableOrgUnits.length > 1 ? (
        <form method="get" className="flex items-center gap-2">
          <label className="text-sm text-ink">{dict.reports.office}</label>
          <select name="org_unit_id" defaultValue={rootOrgUnitId} className="rounded-md border border-border px-3 py-2 text-sm">
            {overseeableOrgUnits.map((ou) => (
              <option key={ou.id} value={ou.id}>
                {ou.name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-ecowas-green-tint">
            {dict.common.view}
          </button>
        </form>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        {buckets.map((bucket) => (
          <div key={bucket} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs text-ink-muted">{bucket} {dict.reports.daysLabel}</p>
            <p className="mt-1 text-sm">
              {dict.reports.decisionPending}: <span className="font-semibold">{countFor(bucket, "decision_pending")}</span>
            </p>
            <p className="text-sm">
              {dict.reports.deliveryOutstanding}: <span className="font-semibold">{countFor(bucket, "delivery_outstanding")}</span>
            </p>
          </div>
        ))}
      </div>

      {newlyInheritedCount > 0 ? (
        <p className="text-sm text-ecowas-brown">{dict.reports.newlyInheritedNote(newlyInheritedCount)}</p>
      ) : null}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.reports.drilldownTitle}</h2>
        {drilldown.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.reports.nothingOpen}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-ink-muted">
              <tr>
                <th className="px-3 py-2">{dict.reports.colCode}</th>
                <th className="px-3 py-2">{dict.reports.colSubject}</th>
                <th className="px-3 py-2">{dict.reports.colOrigin}</th>
                <th className="px-3 py-2">{dict.reports.colPendingAt}</th>
                <th className="px-3 py-2">{dict.reports.colDays}</th>
                <th className="px-3 py-2">{dict.reports.colTags}</th>
              </tr>
            </thead>
            <tbody>
              {drilldown.map((row) => (
                <tr key={row.document_id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{row.unique_code}</td>
                  <td className="px-3 py-2">{row.subject}</td>
                  <td className="px-3 py-2 text-ink-muted">{row.originating_office_name}</td>
                  <td className="px-3 py-2 text-ink-muted">{row.pending_office_name}</td>
                  <td className="px-3 py-2">
                    <DaysBadge days={row.days_in_office} dict={dict} />
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-muted">
                    {row.decision_pending ? `${dict.reports.decisionPending} ` : ""}
                    {row.delivery_outstanding ? dict.reports.deliveryOutstanding : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
