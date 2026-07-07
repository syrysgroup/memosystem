import { getCurrentProfile, getMyActivePositions, getOrgUnits } from "@/lib/data";
import { logIncomingLetter } from "./actions";
import { trackDocument } from "../documents/actions";

export default async function RegistryPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [positions, orgUnits] = await Promise.all([getMyActivePositions(profile.id), getOrgUnits()]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">Registry</h1>
        <p className="text-sm text-ink-muted">
          Log incoming external correspondence here — it mints its own code under your office&rsquo;s prefix. Outgoing
          dispatch acknowledgment is recorded on the document&rsquo;s own page (Update physical status → delivered, then
          attach the signed acknowledgment) once it reaches you for dispatch.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Look up a document for a visitor</h2>
        <form action={trackDocument} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-ink">Unique code</label>
            <input
              name="unique_code"
              placeholder="e.g. FIN-MEM-2026-0001"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            Look up
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">
          You can always decode the origin office from the code&rsquo;s first segment, even for documents you have no
          other access to — the lookup form above will only open documents you&rsquo;re actually authorized to see.
        </p>
      </div>

      {positions.length === 0 ? (
        <p className="text-sm text-ecowas-brown">You need an active Position to log incoming correspondence.</p>
      ) : (
        <form action={logIncomingLetter} className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Log an incoming letter</h2>
          {positions.length > 1 ? (
            <div>
              <label className="text-sm font-medium text-ink">Logging as</label>
              <select name="originating_position_id" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
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
            <label className="text-sm font-medium text-ink">Subject</label>
            <input name="subject" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink">Sender name</label>
              <input name="correspondent_name" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Sender organization</label>
              <input name="correspondent_organization" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Scan of the letter</label>
            <input type="file" name="file" className="mt-1 w-full text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            Log incoming letter
          </button>
        </form>
      )}
    </div>
  );
}
