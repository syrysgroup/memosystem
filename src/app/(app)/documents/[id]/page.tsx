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
import { getDictionary } from "@/lib/i18n/get-dictionary";

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

  const dict = await getDictionary();
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

  const orgUnitName = (id: string | null) => orgUnits.find((ou) => ou.id === id)?.name ?? dict.common.dash;
  const positionLabel = (positionId: string | null) => {
    if (!positionId) return dict.common.dash;
    const pos = referencedPositions.find((p) => p.id === positionId);
    if (!pos) return positionId;
    const person = referencedProfiles.find((pr) => pr.id === pos.profile_id);
    return `${person?.full_name ?? dict.documentDetail.unknownPerson} (${orgUnitName(pos.org_unit_id)})`;
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
            <TierBadge tier={document.requester_tier} labels={dict.badges.tier} />
            <DigitalStatusBadge status={document.digital_status} labels={dict.badges.digital} />
            <PhysicalStatusBadge status={document.physical_status} labels={dict.badges.physical} />
            <DecisionStatusBadge status={document.decision_status} labels={dict.badges.decision} />
            {document.is_closed ? (
              <span className="rounded bg-ecowas-green px-2 py-0.5 text-xs font-medium text-white">{dict.documentDetail.closed}</span>
            ) : null}
          </div>
        </div>

        {document.summary ? <p className="mt-4 text-sm text-ink">{document.summary}</p> : null}

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-muted">{dict.documentDetail.originatedBy}</dt>
            <dd className="text-ink">{positionLabel(document.originating_position_id)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{dict.documentDetail.digitalCustodian}</dt>
            <dd className="text-ink">{positionLabel(document.current_digital_custodian_id)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{dict.documentDetail.physicalCustodian}</dt>
            <dd className="text-ink">{positionLabel(document.current_physical_custodian_id)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{dict.documentDetail.daysInOffice}</dt>
            <dd><DaysBadge days={document.days_in_office} dict={dict} /></dd>
          </div>
          <div>
            <dt className="text-ink-muted">{dict.documentDetail.daysInSystem}</dt>
            <dd><DaysBadge days={document.days_in_system} dict={dict} /></dd>
          </div>
          <div>
            <dt className="text-ink-muted">{dict.documentDetail.created}</dt>
            <dd className="text-ink">{new Date(document.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>

        {document.decision_status !== "open" && document.decision_status !== "pending_decision" ? (
          <div className="mt-4 rounded-md bg-paper p-4 text-sm">
            <p className="font-medium text-ink">
              {dict.documentDetail.decisionLabel}: {dict.badges.decision[document.decision_status]}{" "}
              {document.decision_number ? `(${document.decision_number})` : ""}
            </p>
            <p className="text-ink-muted">{document.decision_summary}</p>
          </div>
        ) : null}

        {document.superseded_at ? (
          <div className="mt-4 rounded-md bg-ecowas-yellow/10 p-4 text-sm">
            <p className="font-medium text-ecowas-brown">
              {dict.documentDetail.supersededBy
                .replace("{date}", new Date(document.superseded_at).toLocaleDateString())
                .replace("{position}", positionLabel(document.superseded_by_position_id))}
            </p>
            <p className="text-ecowas-brown">{document.superseded_reason}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {isDigitalCustodian ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-ink">{dict.documentDetail.routeDigitally}</h2>
            <form action={routeDigital} className="space-y-2">
              <input type="hidden" name="document_id" value={document.id} />
              <select name="digital_status" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                {DIGITAL_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {dict.badges.digital[s]}
                  </option>
                ))}
              </select>
              <select name="to_position_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value={document.current_digital_custodian_id ?? ""}>{dict.documentDetail.keepCurrentCustodian}</option>
                {referencedPositions
                  .filter((p) => p.id !== document.current_digital_custodian_id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {positionLabel(p.id)}
                    </option>
                  ))}
              </select>
              <button type="submit" className="rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white">
                {dict.common.apply}
              </button>
            </form>

            <form action={addMinute} className="space-y-2 border-t border-border pt-3">
              <h2 className="text-sm font-semibold text-ink">{dict.documentDetail.addMinute}</h2>
              <input type="hidden" name="document_id" value={document.id} />
              <input type="hidden" name="author_position_id" value={document.current_digital_custodian_id ?? ""} />
              <textarea name="content" required placeholder={dict.documentDetail.minutePlaceholder} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-ecowas-green-tint">
                {dict.documentDetail.postMinute}
              </button>
            </form>
          </div>
        ) : null}

        <div className="space-y-3">
          {isPhysicalCustodian ? (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-ink">{dict.documentDetail.updatePhysical}</h2>
              <form action={routePhysical} className="space-y-2">
                <input type="hidden" name="document_id" value={document.id} />
                <select name="physical_status" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  {PHYSICAL_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {dict.badges.physical[s]}
                    </option>
                  ))}
                </select>
                <select name="to_position_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value={document.current_physical_custodian_id ?? ""}>{dict.documentDetail.keepCurrentCustodian}</option>
                  {referencedPositions
                    .filter((p) => p.id !== document.current_physical_custodian_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {positionLabel(p.id)}
                      </option>
                    ))}
                </select>
                <select name="physical_failure_reason" className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value="">{dict.documentDetail.failureReasonPlaceholder}</option>
                  {FAILURE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {dict.documentDetail.failureReasons[r]}
                    </option>
                  ))}
                </select>
                <input name="physical_failure_note" placeholder={dict.documentDetail.failureNotePlaceholder} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-ecowas-green-tint">
                  {dict.common.apply}
                </button>
              </form>
            </div>
          ) : null}

          {canDecide && isDecisionOpen ? (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-ink">{dict.documentDetail.makeDecision}</h2>
              <form action={makeDecision} className="space-y-2">
                <input type="hidden" name="document_id" value={document.id} />
                <select name="decision_status" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  <option value="approved">{dict.documentDetail.approved}</option>
                  <option value="rejected">{dict.documentDetail.rejected}</option>
                  <option value="withdrawn">{dict.documentDetail.withdrawn}</option>
                </select>
                <textarea name="decision_summary" required placeholder={dict.documentDetail.decisionSummaryPlaceholder} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <input name="decision_number" placeholder={dict.documentDetail.decisionNumberPlaceholder} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md bg-ecowas-green px-3 py-2 text-sm font-medium text-white">
                  {dict.documentDetail.decide}
                </button>
              </form>
            </div>
          ) : null}

          {canSupersede ? (
            <div className="space-y-2 rounded-lg border border-ecowas-yellow/40 bg-ecowas-yellow/10 p-4">
              <h2 className="text-sm font-semibold text-ink">{dict.documentDetail.supersedeSgOnly}</h2>
              <form action={supersedeCircular} className="space-y-2">
                <input type="hidden" name="document_id" value={document.id} />
                <input name="reason" required placeholder={dict.documentDetail.reasonPlaceholder} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md border border-ecowas-brown/50 px-3 py-2 text-sm font-medium text-ecowas-brown">
                  {dict.documentDetail.supersede}
                </button>
              </form>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-ink">{dict.documentDetail.attachFile}</h2>
            <form action={uploadAttachment} className="space-y-2">
              <input type="hidden" name="document_id" value={document.id} />
              <select name="kind" className="w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value="scan">{dict.documentDetail.kindScan}</option>
                <option value="acknowledgment">{dict.documentDetail.kindAcknowledgment}</option>
                <option value="decision_stamp">{dict.documentDetail.kindDecisionStamp}</option>
                <option value="other">{dict.documentDetail.kindOther}</option>
              </select>
              <input type="file" name="file" required className="w-full text-sm" />
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-ecowas-green-tint">
                {dict.common.upload}
              </button>
            </form>
          </div>
        </div>
      </div>

      {attachmentLinks.length > 0 ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">{dict.documentDetail.attachments}</h2>
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
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.documentDetail.minutes}</h2>
        {minutes.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.documentDetail.noMinutesVisible}</p>
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
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.documentDetail.movementHistory}</h2>
        <ol className="space-y-3">
          {movements.map((m) => (
            <li key={m.id} className="border-l-2 border-border pl-4 text-sm">
              <p className="text-ink">
                [{m.channel}] {m.from_position_id ? positionLabel(m.from_position_id) : dict.documentDetail.originated} → {positionLabel(m.to_position_id)}
              </p>
              <p className="text-xs text-ink-muted">{new Date(m.occurred_at).toLocaleString()}</p>
              {m.resulting_digital_status ? (
                <p className="text-xs text-ink-muted">
                  {dict.documentDetail.digitalPrefix}: {dict.badges.digital[m.resulting_digital_status]}
                </p>
              ) : null}
              {m.resulting_physical_status ? (
                <p className="text-xs text-ink-muted">
                  {dict.documentDetail.physicalPrefix}: {dict.badges.physical[m.resulting_physical_status]}
                </p>
              ) : null}
              {m.resulting_decision_status ? (
                <p className="text-xs text-ink-muted">
                  {dict.documentDetail.decisionPrefix}: {dict.badges.decision[m.resulting_decision_status]}
                </p>
              ) : null}
              {m.failure_reason ? (
                <p className="text-xs text-ecowas-deep-red">
                  {dict.documentDetail.deliveryFailed}: {dict.documentDetail.failureReasons[m.failure_reason]}
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
