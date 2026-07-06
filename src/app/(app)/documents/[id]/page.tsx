import { notFound } from "next/navigation";
import { getAttachmentUrl, getCurrentProfile, getDocumentDetail, getOrgUnits } from "@/lib/data";
import { StatusBadge, DaysBadge } from "@/components/badges";
import {
  acknowledgeMovement,
  routeDocument,
  updateDocumentStatus,
  uploadAttachment,
} from "../actions";

const STATUS_OPTIONS = ["draft", "pending", "under_review", "approved", "rejected", "dispatched", "closed"] as const;
const MODE_OPTIONS = ["digital", "physical", "both"] as const;

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { document, movements, externalMeta, attachments } = await getDocumentDetail(id);
  if (!document) notFound();

  const orgUnits = await getOrgUnits();
  const canAct = document.current_org_unit_id === profile.org_unit_id && !profile.on_leave;

  const attachmentLinks = await Promise.all(
    attachments.map(async (a) => ({ ...a, url: await getAttachmentUrl(a.storage_path) }))
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-slate-500">{document.reference_code}</p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">{document.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{document.document_type_name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={document.status} />
            <DaysBadge days={document.days_in_current_office} />
          </div>
        </div>

        {document.summary ? <p className="mt-4 text-sm text-slate-700">{document.summary}</p> : null}

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Origin office</dt>
            <dd className="text-slate-900">{document.origin_org_unit_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Currently at</dt>
            <dd className="text-slate-900">{document.current_org_unit_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Copy</dt>
            <dd className="text-slate-900">{document.has_physical_copy ? "Physical + Digital" : "Digital only"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-900">{new Date(document.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>

        {externalMeta ? (
          <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-700">
              External correspondence — {externalMeta.direction} via {externalMeta.channel}
            </p>
            <p className="text-slate-600">
              {externalMeta.correspondent_name}
              {externalMeta.correspondent_organization ? ` (${externalMeta.correspondent_organization})` : ""}
            </p>
            {externalMeta.contact_email ? <p className="text-slate-500">{externalMeta.contact_email}</p> : null}
            {externalMeta.direction === "outgoing" ? (
              <p className="mt-1 text-slate-600">
                Dispatch acknowledgment: {externalMeta.dispatch_ack_received ? "Received" : "Not yet received"}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {canAct ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <form action={routeDocument} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Route to another office</h2>
            <input type="hidden" name="document_id" value={document.id} />
            <select name="to_org_unit_id" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select destination office…</option>
              {orgUnits
                .filter((ou) => ou.id !== document.current_org_unit_id)
                .map((ou) => (
                  <option key={ou.id} value={ou.id}>
                    {ou.name}
                  </option>
                ))}
            </select>
            <select name="mode" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {MODE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <textarea
              name="remarks"
              placeholder="Remarks / action taken"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Route document
            </button>
          </form>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <form action={updateDocumentStatus} className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">Update status</h2>
              <input type="hidden" name="document_id" value={document.id} />
              <select name="status" defaultValue={document.status} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Save status
              </button>
            </form>

            <form action={uploadAttachment} className="space-y-2 border-t border-slate-100 pt-3">
              <h2 className="text-sm font-semibold text-slate-900">Attach a scan</h2>
              <input type="hidden" name="document_id" value={document.id} />
              <select name="kind" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="scan">Scan of original</option>
                <option value="acknowledgment">Acknowledgment</option>
                <option value="other">Other</option>
              </select>
              <input type="file" name="file" required className="w-full text-sm" />
              <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Upload
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          {profile.on_leave
            ? "You are on leave — read-only access. Your delegate can act on documents in your office."
            : "This document is not currently in your office, so you have read-only access."}
        </p>
      )}

      {attachmentLinks.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Attachments</h2>
          <ul className="space-y-1 text-sm">
            {attachmentLinks.map((a) => (
              <li key={a.id}>
                {a.url ? (
                  <a href={a.url} className="text-slate-900 underline" target="_blank" rel="noreferrer">
                    {a.file_name}
                  </a>
                ) : (
                  a.file_name
                )}
                <span className="ml-2 text-xs text-slate-400">({a.kind})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Movement history</h2>
        <ol className="space-y-3">
          {movements.map((m) => {
            const from = orgUnits.find((o) => o.id === m.from_org_unit_id);
            const to = orgUnits.find((o) => o.id === m.to_org_unit_id);
            const needsAck = m.mode !== "digital" && !m.received_at && m.to_org_unit_id === profile.org_unit_id;
            return (
              <li key={m.id} className="border-l-2 border-slate-200 pl-4 text-sm">
                <p className="text-slate-900">
                  {from ? from.name : "Originated"} → {to?.name}{" "}
                  <span className="text-xs text-slate-400">({m.mode})</span>
                </p>
                <p className="text-xs text-slate-500">Sent {new Date(m.sent_at).toLocaleString()}</p>
                {m.received_at ? (
                  <p className="text-xs text-emerald-700">Received {new Date(m.received_at).toLocaleString()}</p>
                ) : m.mode !== "digital" ? (
                  <p className="text-xs text-amber-700">Physical copy not yet acknowledged as received</p>
                ) : null}
                {m.remarks ? <p className="mt-1 text-xs text-slate-600">{m.remarks}</p> : null}
                {needsAck ? (
                  <form action={acknowledgeMovement} className="mt-1">
                    <input type="hidden" name="movement_id" value={m.id} />
                    <input type="hidden" name="document_id" value={document.id} />
                    <button type="submit" className="text-xs font-medium text-slate-900 underline">
                      Acknowledge physical receipt
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
