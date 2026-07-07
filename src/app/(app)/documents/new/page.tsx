import { getCurrentProfile, getDocumentTypes, getMyActivePositions, getOrgUnits } from "@/lib/data";
import { createDocument } from "../actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { roleLabel } from "@/lib/labels";

export default async function NewDocumentPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const [documentTypes, positions, orgUnits] = await Promise.all([
    getDocumentTypes(),
    getMyActivePositions(profile.id),
    getOrgUnits(),
  ]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const nonCorrespondenceTypes = documentTypes.filter((dt) => !dt.is_external_correspondence);

  if (positions.length === 0) {
    return <p className="text-sm text-ecowas-brown">{dict.documentsNew.noPosition}</p>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-ink">{dict.documentsNew.title}</h1>
      <p className="text-sm text-ink-muted">
        {dict.documentsNew.externalNote}{" "}
        <a href="/registry" className="underline">
          {dict.documentsNew.registryLink}
        </a>{" "}
        page instead — the registry mints its own codes for external intake.
      </p>

      <form action={createDocument} className="space-y-4 rounded-lg border border-border bg-surface p-6">
        {positions.length > 1 ? (
          <div>
            <label className="text-sm font-medium text-ink">{dict.documentsNew.originatingPosition}</label>
            <select
              name="originating_position_id"
              required
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {roleLabel(p.role, dict)} — {orgUnitName(p.org_unit_id)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="originating_position_id" value={positions[0].id} />
        )}

        <div>
          <label className="text-sm font-medium text-ink">{dict.documentsNew.documentType}</label>
          <select name="document_type_id" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
            {nonCorrespondenceTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">{dict.documentsNew.subject}</label>
          <input name="subject" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">{dict.documentsNew.summary}</label>
          <textarea name="summary" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
          {dict.common.create}
        </button>
      </form>
    </div>
  );
}
