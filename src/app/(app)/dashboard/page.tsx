import Link from "next/link";
import { getCurrentProfile, getMyActivePositions, getMyQueueDocuments, getOrgUnits } from "@/lib/data";
import { trackDocument } from "../documents/actions";
import { DigitalStatusBadge, PhysicalStatusBadge, DecisionStatusBadge, DaysBadge, OVERDUE_THRESHOLD_DAYS } from "@/components/badges";
import { roleLabel, namedRoleLabel, scopeDescription } from "@/lib/labels";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  const { notfound } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const positions = await getMyActivePositions(profile.id);
  const [documents, orgUnits] = await Promise.all([
    getMyQueueDocuments(positions.map((p) => p.id)),
    getOrgUnits(),
  ]);
  const orgUnitName = (id: string | null) => orgUnits.find((ou) => ou.id === id)?.name ?? dict.common.dash;
  const overdueCount = documents.filter((d) => d.days_in_office !== null && d.days_in_office >= OVERDUE_THRESHOLD_DAYS).length;
  const canManageTeam =
    positions.some((p) => p.role === "head" || p.role === "office_manager") || profile.is_org_admin || profile.is_admin;
  const canIssueGrants = profile.is_security_admin || profile.is_admin;
  const decisionAuthorityPositions = positions.filter((p) => p.named_role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">
          {dict.dashboard.welcome.replace("{name}", profile.full_name.split(" ")[0])}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{dict.dashboard.subtitle}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {profile.is_admin ? (
            <span className="rounded-full bg-ecowas-green-tint px-3 py-1 text-xs font-semibold text-ecowas-green">
              {dict.dashboard.administrator}
            </span>
          ) : null}
          {profile.is_org_admin ? (
            <span className="rounded-full bg-ecowas-ocean-blue/15 px-3 py-1 text-xs font-semibold text-ecowas-ocean-blue">
              {dict.dashboard.orgAdmin}
            </span>
          ) : null}
          {profile.is_security_admin ? (
            <span className="rounded-full bg-ecowas-deep-red/15 px-3 py-1 text-xs font-semibold text-ecowas-deep-red">
              {dict.dashboard.securityAdmin}
            </span>
          ) : null}
          {positions.map((p) => (
            <span key={p.id} className="rounded-full bg-border/60 px-3 py-1 text-xs font-medium text-ink">
              {roleLabel(p.role, dict)} · {orgUnitName(p.org_unit_id)}
            </span>
          ))}
          {decisionAuthorityPositions.map((p) => (
            <span
              key={`named-${p.id}`}
              className="rounded-full bg-ecowas-brown/15 px-3 py-1 text-xs font-semibold text-ecowas-brown"
            >
              {namedRoleLabel(p.named_role, dict)}
            </span>
          ))}
        </div>

        {positions.length === 0 ? (
          <p className="text-sm text-ecowas-brown">{dict.dashboard.noPosition}</p>
        ) : (
          <ul className="space-y-1 text-sm text-ink-muted">
            {positions.map((p) => (
              <li key={p.id}>{scopeDescription(p.role, orgUnitName(p.org_unit_id), dict)}</li>
            ))}
          </ul>
        )}

        {decisionAuthorityPositions.length > 0 ? (
          <p className="mt-2 text-sm text-ecowas-brown">{dict.dashboard.decisionAuthorityNote}</p>
        ) : null}

        {(canManageTeam || canIssueGrants) && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {canManageTeam ? (
              <Link href="/team" className="font-medium text-ecowas-green hover:text-ecowas-green-dark">
                {dict.dashboard.manageTeam} &rarr;
              </Link>
            ) : null}
            {canIssueGrants ? (
              <Link href="/audit-grants" className="font-medium text-ecowas-green hover:text-ecowas-green-dark">
                {dict.dashboard.issueGrant} &rarr;
              </Link>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-2xl font-bold text-ink">{documents.length}</p>
          <p className="text-sm text-ink-muted">{dict.dashboard.inYourHands}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-ecowas-deep-red" : "text-ink"}`}>{overdueCount}</p>
          <p className="text-sm text-ink-muted">{dict.dashboard.overdue}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <form action={trackDocument} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-ink">{dict.dashboard.trackLabel}</label>
            <input
              name="unique_code"
              placeholder={dict.dashboard.trackPlaceholder}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            {dict.common.track}
          </button>
        </form>
        {notfound ? (
          <p className="mt-2 text-sm text-ecowas-deep-red">{dict.dashboard.notFound.replace("{code}", notfound)}</p>
        ) : null}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">{dict.dashboard.inYourHands}</h2>
        <p className="text-sm text-ink-muted">{dict.dashboard.inYourHandsSubtitle}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2">{dict.dashboard.colCode}</th>
              <th className="px-4 py-2">{dict.dashboard.colSubject}</th>
              <th className="px-4 py-2">{dict.dashboard.colDigital}</th>
              <th className="px-4 py-2">{dict.dashboard.colPhysical}</th>
              <th className="px-4 py-2">{dict.dashboard.colDecision}</th>
              <th className="px-4 py-2">{dict.dashboard.colDays}</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  {dict.dashboard.nothingInHands}
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
                    <DigitalStatusBadge status={doc.digital_status} labels={dict.badges.digital} />
                  </td>
                  <td className="px-4 py-2">
                    <PhysicalStatusBadge status={doc.physical_status} labels={dict.badges.physical} />
                  </td>
                  <td className="px-4 py-2">
                    <DecisionStatusBadge status={doc.decision_status} labels={dict.badges.decision} />
                  </td>
                  <td className="px-4 py-2">
                    <DaysBadge days={doc.days_in_office} dict={dict} />
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
