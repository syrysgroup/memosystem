import { getDocumentTypes } from "@/lib/data";
import { createDocument } from "../actions";

export default async function NewDocumentPage() {
  const documentTypes = (await getDocumentTypes()).filter((dt) => !dt.is_external_correspondence);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Originate a new document</h1>
      <p className="text-sm text-slate-500">
        Registry-tracked incoming/outgoing correspondence is logged from the{" "}
        <a href="/registry" className="underline">
          Registry
        </a>{" "}
        page instead.
      </p>

      <form action={createDocument} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="text-sm font-medium text-slate-700">Document type</label>
          <select name="document_type_id" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {documentTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Summary</label>
          <textarea name="summary" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="has_physical_copy" />
          A physical copy will also circulate
        </label>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Create
        </button>
      </form>
    </div>
  );
}
