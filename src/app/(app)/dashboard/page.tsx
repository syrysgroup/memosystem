import Link from "next/link";
import { getCurrentProfile, getOfficeDocuments } from "@/lib/data";
import { trackDocument } from "../documents/actions";
import { StatusBadge, DaysBadge } from "@/components/badges";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notfound?: string }>;
}) {
  const { notfound } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const documents = await getOfficeDocuments(profile.org_unit_id);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <form action={trackDocument} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700">Track a document by reference code</label>
            <input
              name="reference_code"
              placeholder="e.g. MEMO/FINDIR/2026/0001"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Track
          </button>
        </form>
        {notfound ? (
          <p className="mt-2 text-sm text-red-600">No document found for &ldquo;{notfound}&rdquo;.</p>
        ) : null}
      </div>

      <div>
        <h1 className="text-lg font-semibold text-slate-900">Documents currently in your office</h1>
        <p className="text-sm text-slate-500">Sorted by longest-waiting first.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Days here</th>
              <th className="px-4 py-2">Copy</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No documents currently in your office.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/documents/${doc.id}`} className="text-slate-900 underline-offset-2 hover:underline">
                      {doc.reference_code}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{doc.title}</td>
                  <td className="px-4 py-2 text-slate-500">{doc.document_type_name}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-2">
                    <DaysBadge days={doc.days_in_current_office} />
                  </td>
                  <td className="px-4 py-2 text-slate-500">{doc.has_physical_copy ? "Physical + Digital" : "Digital"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
