import { getCurrentProfile, getDocumentTypes, getMyActivePositions, getOrgUnits } from "@/lib/data";
import { createDocument } from "../actions";

export default async function NewDocumentPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [documentTypes, positions, orgUnits] = await Promise.all([
    getDocumentTypes(),
    getMyActivePositions(profile.id),
    getOrgUnits(),
  ]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const nonCorrespondenceTypes = documentTypes.filter((dt) => !dt.is_external_correspondence);

  if (positions.length === 0) {
    return (
      <p className="text-sm text-ecowas-brown">
        You don&rsquo;t hold a Position yet, so you can&rsquo;t originate a document. Ask an admin to create one for you.
      </p>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-ink">Originate a new document</h1>
      <p className="text-sm text-ink-muted">
        Incoming/outgoing correspondence is logged from the{" "}
        <a href="/registry" className="underline">
          Registry
        </a>{" "}
        page instead — the registry mints its own codes for external intake.
      </p>

      <form action={createDocument} className="space-y-4 rounded-lg border border-border bg-surface p-6">
        {positions.length > 1 ? (
          <div>
            <label className="text-sm font-medium text-ink">Originating position</label>
            <select
              name="originating_position_id"
              required
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.role} — {orgUnitName(p.org_unit_id)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="originating_position_id" value={positions[0].id} />
        )}

        <div>
          <label className="text-sm font-medium text-ink">Document type</label>
          <select name="document_type_id" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
            {nonCorrespondenceTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Subject</label>
          <input name="subject" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Summary</label>
          <textarea name="summary" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
          Create
        </button>
      </form>
    </div>
  );
}
