import {
  getAvatarUrl,
  getCurrentProfile,
  getMyActivePositions,
  getOrgUnits,
  getPositionTypes,
} from "@/lib/data";
import { updateMyProfile } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { roleLabel } from "@/lib/labels";
import { Avatar } from "@/components/avatar";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const [positions, orgUnits, positionTypes, avatarUrl] = await Promise.all([
    getMyActivePositions(profile.id),
    getOrgUnits(),
    getPositionTypes(),
    getAvatarUrl(profile.avatar_path),
  ]);

  const orgUnitName = (id: string) => orgUnits.find((ou) => ou.id === id)?.name ?? id;
  const positionTypeTitle = (id: string | null) => positionTypes.find((pt) => pt.id === id)?.title ?? dict.common.dash;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">{dict.profile.title}</h1>
        <p className="text-sm text-ink-muted">{dict.profile.subtitle}</p>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-6">
        <Avatar name={profile.full_name} size={64} photoUrl={avatarUrl} />
        <div>
          <p className="text-base font-semibold text-ink">{profile.full_name}</p>
          <p className="text-sm text-ink-muted">{profile.email}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">{dict.profile.positionsTitle}</h2>
        {positions.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.profile.noPositions}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="py-1 pr-4">{dict.profile.colOffice}</th>
                <th className="py-1 pr-4">{dict.profile.colRole}</th>
                <th className="py-1 pr-4">{dict.profile.colGrade}</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-1 pr-4">{orgUnitName(p.org_unit_id)}</td>
                  <td className="py-1 pr-4 text-ink-muted">{roleLabel(p.role, dict)}</td>
                  <td className="py-1 pr-4 text-ink-muted">
                    {p.position_type_id ? `${positionTypeTitle(p.position_type_id)} — ${p.grade ?? dict.common.dash}` : dict.common.dash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form action={updateMyProfile} className="space-y-4 rounded-lg border border-border bg-surface p-6">
        {saved ? <p className="text-sm text-ecowas-green">{dict.profile.saved}</p> : null}

        <div>
          <label className="text-sm font-medium text-ink">{dict.profile.avatarLabel}</label>
          <input type="file" name="avatar" accept="image/*" className="mt-1 w-full text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">{dict.profile.phoneLabel}</label>
          <input
            name="phone_number"
            defaultValue={profile.phone_number ?? ""}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">{dict.profile.nationalityLabel}</label>
          <input
            name="nationality"
            defaultValue={profile.nationality ?? ""}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">{dict.profile.dateOfAppointmentLabel}</label>
          <input
            type="date"
            name="date_of_appointment"
            defaultValue={profile.date_of_appointment ?? ""}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">{dict.profile.bioLabel}</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            placeholder={dict.profile.bioPlaceholder}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </div>

        <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
          {dict.profile.saveButton}
        </button>
      </form>
    </div>
  );
}
