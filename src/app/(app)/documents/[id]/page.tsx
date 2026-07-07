import { notFound } from "next/navigation";
import {
  getActiveDelegationsAsDelegate,
  getAttachmentUrl,
  getCurrentProfile,
  getDocumentDetail,
  getDocumentType,
  getMyActivePositions,
  getOrgUnits,
  getPositionsByIds,
  getProfilesByIds,
} from "@/lib/data";
import {
  DigitalStatusBadge,
  PhysicalStatusBadge,
  DecisionStatusBadge,
  TierBadge,
  DaysBadge,
} from "@/components/badges";
import {
  addMinute,
  makeDecision,
  routeDigital,
  routePhysical,
  supersedeCircular,
  uploadAttachment,
} from "../actions";

const DIGITAL_OPTIONS = ["in_transit", "at_office", "under_review", "minuted"] as const;
const PHYSICAL_OPTIONS = ["not_dispatched", "in_transit", "delivered", "delivery_failed"] as const;
const FAILURE_REASONS = [
  "recipient_absent",
  "office_closed",
  "recipient_refused",
  "wrong_office",
  "document_damaged",
  "other",
] as const;

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { document, movements, minutes, attachments } = await getDocumentDetail(id);
  if (!document) notFound();

  const [myPositions, orgUnits, documentType] = await Promise.all([
    getMyActivePositions(profile.id),
    getOrgUnits(false),
    getDocumentType(document.document_type_id),
  ]);
  const delegationsAsDelegate = await getActiveDelegationsAsDelegate(myPositions.map((p) => p.id));

  const myPositionIds = myPositions.map((p) => p.id);
  const delegatedOriginalPositionIds = delegationsAsDelegate.map((d) => d.original_position_id);

  const isDigitalCustodian =
    !!document.current_digital_custodian_id &&
    (myPositionIds.includes(document.current_digital_custodian_id) ||
      delegatedOriginalPositionIds.includes(document.current_digital_custodian_id));
  const isPhysicalCustodian =
    !!document.current_physical_custodian_id &&
    (myPositionIds.includes(document.current_physical_custodian_id) ||
      delegatedOriginalPositionIds.includes(document.current_physical_custodian_id));

  const referencedPositionIds = [
    document.originating_position_id,
    document.current_digital_custodian_id,
    document.current_physical_custodian_id,
    document.superseded_by_position_id,
    ...movements.flatMap((m) => [m.from_position_id, m.to_position_id]),
    ...minutes.map((m) => m.author_position_id),
  ].filter((x): x is string => !!x);

  const referencedPositions = await getPositionsByIds(referencedPositionIds);
  const referencedProfiles = await getProfilesByIds(referencedPositions.map((p) => p.profile_id));

  const orgUnitName = (id: string | null) => orgUnits.find((ou) => ou.id === id)?.name ?? "—";
  const positionLabel = (positionId: string | null) => {
    if (!positionId) return "—";
    const pos = referencedPositions.find((p) => p.id === positionId);
    if (!pos) return positionId;
    const person = referencedProfiles.find((pr) => pr.id === pos.profile_id);
    return `${person?.full_name ?? "Unknown"} (${orgUnitName(pos.org_unit_id)})`;
  };

  const canDecide =
    isDigitalCustodian && documentType.decision_authority_role.includes("current_custodian")
      ? true
      : myPositions.some((p) => p.named_role && documentType.decision_authority_role.includes(p.named_role));
  const isDecisionOpen = document.decision_status === "open" || document.decision_status === "pending_decision";

  const isSg = myPositions.some((p) => p.named_role === "sg");
  const canSupersede = isSg && documentType.code === "CIRC" && document.decision_status === "approved" && !document.superseded_at;

  const attachmentLinks = await Promise.all(
    attachments.map(async (a) => ({ ...a, url: await getAttachmentUrl(a.storage_path) }))
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-ink-muted">{document.unique_code}</p>
            <h1 className="mt-1 text-xl font-semibold text-ink">{document.subject}</h1>
            <p className="mt-1 text-sm text-ink-muted">{document.document_type_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <TierBadge tier={document.requester_tier} />
            <DigitalStatusBadge status={document.digital_status} />
            <PhysicalStatusBadge status={document.physical_status} />
            <DecisionStatusBadge status={document.decision_status} />
            {document.is_closed ? (
              <span className="rounded bg-ecowas-green px-2 py-0.5 text-xs font-medium text-white">Closed</span>
            ) : null}
          </div>
        </div>

        {document.summary ? <p className="mt-4 text-sm text-ink">{document.summary}</p> : null}

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-muted">Originated by</dt>
            <dd className="text-ink">{positionLabel(document.originating_position_id)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Digital custodian</dt>
            <dd className="text-ink">{positionLabel(document.current_digital_custodian_id)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Physical custodian</dt>
            <dd className="text-ink">{positionLabel(document.current_physical_custodian_id)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Days in current office</dt>
            <dd><DaysBadge days={document.days_in_office} /></dd>
          </div>
          <div>
            <dt className="text-ink-muted">Days in system</dt>
            <dd><DaysBadge days={document.days_in_system} /></dd>
          </div>
          <div>
            <dt className="text-ink-muted">Created</dt>
            <dd className="text-ink">{new Date(document.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>

        {document.decision_status !== "open" && document.decision_status !== "pending_decision" ? (
          <div className="mt-4 rounded-md bg-paper p-4 text-sm">
            <p className="font-medium text-ink">
              Decision: {document.decision_status} {document.decision_number ? `(${document.decision_number})` : ""}
            </p>
            <p className="text-ink-muted">{document.decision_summary}</p>
          </div>
        ) : null}

        {document.superseded_at ? (
          <div className="mt-4 rounded-md bg-ecowas-yellow/10 p-4 text-sm">
            <p className="font-medium text-ecowas-brown">
              Superseded {new Date(document.superseded_at).toLocaleDateString()} by {positionLabel(document.superseded_by_position_id)}
            </p>
            <p className="text-ecowas-brown">{document.superseded_reason}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {isDigitalCustodian ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-ink">Route digitally</h2>
            <form action={routeDigital} className="space-y-2">
              <input type="hidden" name="document_id" value={document.id} />
              <select name="digital_status" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                {DIGITAL_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              <select name="to_position_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value={document.current_digital_custodian_id ?? ""}>Keep current custodian</option>
                {referencedPositions
                  .filter((p) => p.id !== document.current_digital_custodian_id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {positionLabel(p.id)}
                    </option>
                  ))}
              </select>
              <button type="submit" className="rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white">
                Apply
              </button>
            </form>

            <form action={addMinute} className="space-y-2 border-t border-border pt-3">
              <h2 className="text-sm font-semibold text-ink">Add a minute</h2>
              <input type="hidden" name="document_id" value={document.id} />
              <input type="hidden" name="author_position_id" value={document.current_digital_custodian_id ?? ""} />
              <textarea name="content" required placeholder="Minute…" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-ecowas-green-tint">
                Post minute
              </button>
            </form>
          </div>
        ) : null}

        <div className="space-y-3">
          {isPhysicalCustodian ? (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-ink">Update physical status</h2>
              <form action={routePhysical} className="space-y-2">
                <input type="hidden" name="document_id" value={document.id} />
                <select name="physical_status" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  {PHYSICAL_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <select name="to_position_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value={document.current_physical_custodian_id ?? ""}>Keep current custodian</option>
                  {referencedPositions
                    .filter((p) => p.id !== document.current_physical_custodian_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {positionLabel(p.id)}
                      </option>
                    ))}
                </select>
                <select name="physical_failure_reason" className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value="">Delivery failure reason (if applicable)</option>
                  {FAILURE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <input name="physical_failure_note" placeholder="Note (required if reason is 'other')" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-ecowas-green-tint">
                  Apply
                </button>
              </form>
            </div>
          ) : null}

          {canDecide && isDecisionOpen ? (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-ink">Make a decision</h2>
              <form action={makeDecision} className="space-y-2">
                <input type="hidden" name="document_id" value={document.id} />
                <select name="decision_status" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <textarea name="decision_summary" required placeholder="Plain-language decision summary" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <input name="decision_number" placeholder="Decision number (optional)" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white">
                  Decide
                </button>
              </form>
            </div>
          ) : null}

          {canSupersede ? (
            <div className="space-y-2 rounded-lg border border-ecowas-yellow/40 bg-ecowas-yellow/10 p-4">
              <h2 className="text-sm font-semibold text-ink">Supersede this Circular (SG only)</h2>
              <form action={supersedeCircular} className="space-y-2">
                <input type="hidden" name="document_id" value={document.id} />
                <input name="reason" required placeholder="Reason" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md border border-ecowas-brown/50 px-3 py-2 text-sm font-medium text-ecowas-brown">
                  Supersede
                </button>
              </form>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-ink">Attach a file</h2>
            <form action={uploadAttachment} className="space-y-2">
              <input type="hidden" name="document_id" value={document.id} />
              <select name="kind" className="w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value="scan">Scan of original</option>
                <option value="acknowledgment">Acknowledgment</option>
                <option value="decision_stamp">Decision stamp record</option>
                <option value="other">Other</option>
              </select>
              <input type="file" name="file" required className="w-full text-sm" />
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-ecowas-green-tint">
                Upload
              </button>
            </form>
          </div>
        </div>
      </div>

      {attachmentLinks.length > 0 ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Attachments</h2>
          <ul className="space-y-1 text-sm">
            {attachmentLinks.map((a) => (
              <li key={a.id}>
                {a.url ? (
                  <a href={a.url} className="text-ink underline" target="_blank" rel="noreferrer">
                    {a.file_name}
                  </a>
                ) : (
                  a.file_name
                )}
                <span className="ml-2 text-xs text-ink-muted">({a.kind})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Minutes</h2>
        {minutes.length === 0 ? (
          <p className="text-sm text-ink-muted">No minutes visible to you on this document.</p>
        ) : (
          <ul className="space-y-3">
            {minutes.map((m) => (
              <li key={m.id} className="text-sm">
                <p className="font-medium text-ink">{positionLabel(m.author_position_id)}</p>
                <p className="text-ink-muted">{m.content}</p>
                <p className="text-xs text-ink-muted">{new Date(m.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Movement history</h2>
        <ol className="space-y-3">
          {movements.map((m) => (
            <li key={m.id} className="border-l-2 border-border pl-4 text-sm">
              <p className="text-ink">
                [{m.channel}] {m.from_position_id ? positionLabel(m.from_position_id) : "Originated"} → {positionLabel(m.to_position_id)}
              </p>
              <p className="text-xs text-ink-muted">{new Date(m.occurred_at).toLocaleString()}</p>
              {m.resulting_digital_status ? <p className="text-xs text-ink-muted">Digital: {m.resulting_digital_status}</p> : null}
              {m.resulting_physical_status ? <p className="text-xs text-ink-muted">Physical: {m.resulting_physical_status}</p> : null}
              {m.resulting_decision_status ? <p className="text-xs text-ink-muted">Decision: {m.resulting_decision_status}</p> : null}
              {m.failure_reason ? (
                <p className="text-xs text-ecowas-deep-red">
                  Delivery failed: {m.failure_reason}
                  {m.failure_note ? ` — ${m.failure_note}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
