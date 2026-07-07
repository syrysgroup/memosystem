import Link from "next/link";
import { getCurrentProfile, getMyActivePositions, getMyQueueDocuments, getOrgUnits } from "@/lib/data";
import { trackDocument } from "../documents/actions";
import { DigitalStatusBadge, PhysicalStatusBadge, DecisionStatusBadge, DaysBadge, OVERDUE_THRESHOLD_DAYS } from "@/components/badges";
import { roleLabel, namedRoleLabel, scopeDescription } from "@/lib/labels";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  const { notfound } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const positions = await getMyActivePositions(profile.id);
  const [documents, orgUnits] = await Promise.all([
    getMyQueueDocuments(positions.map((p) => p.id)),
    getOrgUnits(),
  ]);
  const orgUnitName = (id: string | null) => orgUnits.find((ou) => ou.id === id)?.name ?? "—";
  const overdueCount = documents.filter((d) => d.days_in_office !== null && d.days_in_office >= OVERDUE_THRESHOLD_DAYS).length;
  const canManageTeam = positions.some((p) => p.role === "head" || p.role === "office_manager");
  const decisionAuthorityPositions = positions.filter((p) => p.named_role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Welcome, {profile.full_name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-ink-muted">Here&rsquo;s your role, scope, and what needs your attention.</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {profile.is_admin ? (
            <span className="rounded-full bg-ecowas-green-tint px-3 py-1 text-xs font-semibold text-ecowas-green">
              Administrator
            </span>
          ) : null}
          {positions.map((p) => (
            <span key={p.id} className="rounded-full bg-border/60 px-3 py-1 text-xs font-medium text-ink">
              {roleLabel(p.role)} · {orgUnitName(p.org_unit_id)}
            </span>
          ))}
          {decisionAuthorityPositions.map((p) => (
            <span
              key={`named-${p.id}`}
              className="rounded-full bg-ecowas-brown/15 px-3 py-1 text-xs font-semibold text-ecowas-brown"
            >
              {namedRoleLabel(p.named_role)}
            </span>
          ))}
        </div>

        {positions.length === 0 ? (
          <p className="text-sm text-ecowas-brown">
            You don&rsquo;t currently hold a Position in the organogram, so nothing can be assigned to you yet. Ask an
            admin to create one for you.
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-ink-muted">
            {positions.map((p) => (
              <li key={p.id}>{scopeDescription(p.role, orgUnitName(p.org_unit_id))}</li>
            ))}
          </ul>
        )}

        {decisionAuthorityPositions.length > 0 ? (
          <p className="mt-2 text-sm text-ecowas-brown">
            You hold Circular decision authority — Circulars routed to you for a decision will appear in the queue below.
          </p>
        ) : null}

        {(profile.is_admin || canManageTeam) && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {canManageTeam ? (
              <Link href="/team" className="font-medium text-ecowas-green hover:text-ecowas-green-dark">
                Manage my team &rarr;
              </Link>
            ) : null}
            {profile.is_admin ? (
              <Link href="/audit-grants" className="font-medium text-ecowas-green hover:text-ecowas-green-dark">
                Issue an audit grant &rarr;
              </Link>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-2xl font-bold text-ink">{documents.length}</p>
          <p className="text-sm text-ink-muted">In your hands</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-ecowas-deep-red" : "text-ink"}`}>{overdueCount}</p>
          <p className="text-sm text-ink-muted">Overdue ({OVERDUE_THRESHOLD_DAYS}+ days)</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <form action={trackDocument} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-ink">Track a document by its unique code</label>
            <input
              name="unique_code"
              placeholder="e.g. FIN-MEM-2026-0001"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            Track
          </button>
        </form>
        {notfound ? (
          <p className="mt-2 text-sm text-ecowas-deep-red">No document found for &ldquo;{notfound}&rdquo;.</p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">In your hands</h2>
        <p className="text-sm text-ink-muted">Documents currently held by one of your positions.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Digital</th>
              <th className="px-4 py-2">Physical</th>
              <th className="px-4 py-2">Decision</th>
              <th className="px-4 py-2">Days in office</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  Nothing in your hands right now.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-t border-border hover:bg-ecowas-green-tint">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/documents/${doc.id}`} className="text-ink underline-offset-2 hover:underline">
                      {doc.unique_code}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{doc.subject}</td>
                  <td className="px-4 py-2">
                    <DigitalStatusBadge status={doc.digital_status} />
                  </td>
                  <td className="px-4 py-2">
                    <PhysicalStatusBadge status={doc.physical_status} />
                  </td>
                  <td className="px-4 py-2">
                    <DecisionStatusBadge status={doc.decision_status} />
                  </td>
                  <td className="px-4 py-2">
                    <DaysBadge days={doc.days_in_office} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
