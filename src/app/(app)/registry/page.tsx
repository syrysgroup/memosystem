import { getCurrentProfile, getMyActivePositions, getOrgUnits } from "@/lib/data";
import { logIncomingLetter, decodeOrigin } from "./actions";
import { trackDocument } from "../documents/actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { roleLabel } from "@/lib/labels";

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ decode_code?: string; decoded?: string }>;
}) {
  const { decode_code, decoded } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const [positions, orgUnits] = await Promise.all([getMyActivePositions(profile.id), getOrgUnits()]);
  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const registryPositions = positions.filter((p) => orgUnits.find((ou) => ou.id === p.org_unit_id)?.is_registry);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">{dict.registry.title}</h1>
        <p className="text-sm text-ink-muted">{dict.registry.intro}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.registry.decodeTitle}</h2>
        <form action={decodeOrigin} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-ink">{dict.registry.decodeLabel}</label>
            <input
              name="decode_code"
              defaultValue={decode_code}
              placeholder={dict.dashboard.trackPlaceholder}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            {dict.common.decode}
          </button>
        </form>
        {decode_code ? (
          <p className="mt-2 text-sm">
            {decoded ? (
              <>
                {dict.registry.decodeResultPrefix}: <span className="font-medium text-ink">{decoded}</span>
              </>
            ) : (
              <span className="text-ecowas-deep-red">{dict.registry.decodeNoMatch.replace("{code}", decode_code)}</span>
            )}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-ink-muted">{dict.registry.decodeNote}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.registry.lookupTitle}</h2>
        <form action={trackDocument} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-ink">{dict.registry.lookupLabel}</label>
            <input
              name="unique_code"
              placeholder={dict.dashboard.trackPlaceholder}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            {dict.common.lookUp}
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">{dict.registry.lookupNote}</p>
      </div>

      {registryPositions.length === 0 ? (
        <p className="text-sm text-ecowas-brown">{dict.registry.noRegistryPosition}</p>
      ) : (
        <form action={logIncomingLetter} className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">{dict.registry.logTitle}</h2>
          {registryPositions.length > 1 ? (
            <div>
              <label className="text-sm font-medium text-ink">{dict.registry.loggingAs}</label>
              <select name="originating_position_id" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                {registryPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {roleLabel(p.role, dict)} — {orgUnitName(p.org_unit_id)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="originating_position_id" value={registryPositions[0].id} />
          )}
          <div>
            <label className="text-sm font-medium text-ink">{dict.registry.subject}</label>
            <input name="subject" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink">{dict.registry.senderName}</label>
              <input name="correspondent_name" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">{dict.registry.senderOrg}</label>
              <input name="correspondent_organization" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink">{dict.registry.scanFile}</label>
            <input type="file" name="file" className="mt-1 w-full text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
            {dict.registry.logButton}
          </button>
        </form>
      )}
    </div>
  );
}
