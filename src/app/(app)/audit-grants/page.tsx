import { getAllGrants, getCurrentProfile, getGrantsForGrantee, getStaffDirectory } from "@/lib/data";
import { extendGrant, issueGrant, revokeGrant } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionary";

export default async function AuditGrantsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const canManageGrants = profile.is_admin || profile.is_security_admin;
  const [myGrants, staff] = await Promise.all([getGrantsForGrantee(profile.id), getStaffDirectory()]);
  const allGrants = canManageGrants ? await getAllGrants() : [];
  const staffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">{dict.auditGrants.title}</h1>
        <p className="text-sm text-ink-muted">{dict.auditGrants.subtitle}</p>
      </div>

      {canManageGrants ? (
        <form action={issueGrant} className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">{dict.auditGrants.issueTitle}</h2>
          <select name="grantee_profile_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-muted">{dict.auditGrants.auditPeriodStart}</label>
              <input type="date" name="audit_period_start" required className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-ink-muted">{dict.auditGrants.auditPeriodEnd}</label>
              <input type="date" name="audit_period_end" required className="w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-muted">{dict.auditGrants.grantLength}</label>
            <input type="number" name="length_days" min={1} max={90} defaultValue={30} required className="w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <input name="reason" placeholder={dict.auditGrants.reasonPlaceholder} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            {dict.auditGrants.issueButton}
          </button>
        </form>
      ) : null}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.auditGrants.yourGrants}</h2>
        {myGrants.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.auditGrants.noneIssued}</p>
        ) : (
          <GrantsTable grants={myGrants} staffName={staffName} showRevoke={false} dict={dict} />
        )}
      </div>

      {canManageGrants ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">{dict.auditGrants.allGrants}</h2>
          <GrantsTable grants={allGrants} staffName={staffName} showRevoke dict={dict} />
        </div>
      ) : null}
    </div>
  );
}

function GrantsTable({
  grants,
  staffName,
  showRevoke,
  dict,
}: {
  grants: Awaited<ReturnType<typeof getAllGrants>>;
  staffName: (id: string) => string;
  showRevoke: boolean;
  dict: Dictionary;
}) {
  const isExpired = (expiresAt: string) => new Date(expiresAt).getTime() <= Date.now();
  return (
    <table className="w-full text-sm">
      <thead className="bg-paper text-left text-ink-muted">
        <tr>
          <th className="px-3 py-2">{dict.auditGrants.colGrantee}</th>
          <th className="px-3 py-2">{dict.auditGrants.colAuditedPeriod}</th>
          <th className="px-3 py-2">{dict.auditGrants.colExpires}</th>
          <th className="px-3 py-2">{dict.auditGrants.colExtensionDays}</th>
          <th className="px-3 py-2">{dict.auditGrants.colStatus}</th>
          <th className="px-3 py-2"></th>
        </tr>
      </thead>
      <tbody>
        {grants.map((g) => (
          <tr key={g.id} className="border-t border-border">
            <td className="px-3 py-2">{staffName(g.grantee_profile_id)}</td>
            <td className="px-3 py-2 text-ink-muted">
              {g.audit_period_start} → {g.audit_period_end}
            </td>
            <td className="px-3 py-2 text-ink-muted">
              {new Date(g.expires_at).toLocaleString()}
              {isExpired(g.expires_at) ? <span className="ml-1 text-ecowas-deep-red">{dict.auditGrants.expired}</span> : null}
            </td>
            <td className="px-3 py-2 text-ink-muted">
              {g.total_extension_days} / {90 - g.original_length_days} days
            </td>
            <td className="px-3 py-2 text-ink-muted">{dict.auditGrants.statusLabels[g.status]}</td>
            <td className="px-3 py-2 space-x-2">
              {g.status === "active" && !isExpired(g.expires_at) ? (
                <form action={extendGrant} className="inline">
                  <input type="hidden" name="grant_id" value={g.id} />
                  <button type="submit" className="text-xs font-medium text-ink underline">
                    {dict.auditGrants.autoExtend}
                  </button>
                </form>
              ) : null}
              {showRevoke && g.status === "active" ? (
                <form action={revokeGrant} className="inline">
                  <input type="hidden" name="grant_id" value={g.id} />
                  <button type="submit" className="text-xs font-medium text-ecowas-deep-red underline">
                    {dict.auditGrants.revoke}
                  </button>
                </form>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
