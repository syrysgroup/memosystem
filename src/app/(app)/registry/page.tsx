import { getOfficeDocuments, getOrgUnits } from "@/lib/data";
import { StatusBadge, DaysBadge } from "@/components/badges";
import { logIncomingLetter, recordDispatchAcknowledgment } from "./actions";

export default async function RegistryPage() {
  const orgUnits = await getOrgUnits();
  const registry = orgUnits.find((ou) => ou.is_registry);
  const documents = registry ? await getOfficeDocuments(registry.id) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Registry</h1>
        <p className="text-sm text-slate-500">
          Log incoming correspondence, route it to the right office, and record acknowledgments for outgoing dispatch.
        </p>
        {!registry ? (
          <p className="mt-2 text-sm text-red-600">
            No office is marked as the registry yet. An admin should set <code>is_registry = true</code> on one.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={logIncomingLetter} className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Log an incoming letter</h2>
          <div>
            <label className="text-sm font-medium text-slate-700">Title / subject</label>
            <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Summary</label>
            <textarea name="summary" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Sender name</label>
              <input name="correspondent_name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sender organization</label>
              <input name="correspondent_organization" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contact email</label>
              <input name="contact_email" type="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contact phone</label>
              <input name="contact_phone" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Channel received</label>
            <select name="channel" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="physical">Physical (hand-delivered)</option>
              <option value="courier">Courier</option>
              <option value="email">Email</option>
              <option value="fax">Fax</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Route to office</label>
            <select name="destination_org_unit_id" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Keep in Registry for now</option>
              {orgUnits
                .filter((ou) => !ou.is_registry)
                .map((ou) => (
                  <option key={ou.id} value={ou.id}>
                    {ou.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Scan of the letter</label>
            <input type="file" name="file" className="mt-1 w-full text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Log incoming letter
          </button>
        </form>

        <form action={recordDispatchAcknowledgment} className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Record dispatch acknowledgment</h2>
          <p className="text-xs text-slate-500">
            For a document routed to Registry for external dispatch — scan the signed acknowledgment once it comes back.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700">Document reference code</label>
            <input name="reference_code" placeholder="e.g. LTR-OUT/REG/2026/0001" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Recipient name</label>
              <input name="correspondent_name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Recipient organization</label>
              <input name="correspondent_organization" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Dispatch channel</label>
            <select name="channel" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="courier">Courier</option>
              <option value="physical">Hand-delivered</option>
              <option value="email">Email</option>
              <option value="fax">Fax</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Signed acknowledgment scan</label>
            <input type="file" name="file" className="mt-1 w-full text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Mark as dispatched
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Currently at Registry</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Days here</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Nothing currently at Registry.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-xs">
                      <a href={`/documents/${doc.id}`} className="underline">
                        {doc.reference_code}
                      </a>
                    </td>
                    <td className="px-4 py-2">{doc.title}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-2">
                      <DaysBadge days={doc.days_in_current_office} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
