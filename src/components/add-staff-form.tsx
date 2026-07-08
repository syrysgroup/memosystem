"use client";

import { useActionState } from "react";
import { createStaffAccount, type CreateStaffAccountState } from "@/app/(app)/team/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { OrgUnit, PositionType } from "@/lib/supabase/types";

const initialState: CreateStaffAccountState = { error: null, tempPassword: null };

export function AddStaffForm({
  orgUnits,
  positionTypes,
  dict,
}: {
  orgUnits: OrgUnit[];
  positionTypes: PositionType[];
  // Only the specific string keys this form needs -- Dictionary["team"]
  // as a whole carries institutionWideCount, a function, which can't
  // cross into a Client Component (see the README's Internationalization
  // section).
  dict: Pick<
    Dictionary["team"],
    | "addStaffTitle"
    | "addStaffSubtitle"
    | "fullNameLabel"
    | "emailLabel"
    | "roleStaff"
    | "roleOfficeManager"
    | "roleHead"
    | "positionTemplateLabel"
    | "positionTemplateNone"
    | "gradeLabel"
    | "gradePlaceholder"
    | "createAccount"
    | "tempPasswordLabel"
    | "tempPasswordNote"
  >;
}) {
  const [state, formAction, pending] = useActionState(createStaffAccount, initialState);

  const typesByOrgUnit = new Map<string, PositionType[]>();
  for (const pt of positionTypes) {
    const list = typesByOrgUnit.get(pt.org_unit_id) ?? [];
    list.push(pt);
    typesByOrgUnit.set(pt.org_unit_id, list);
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">{dict.addStaffTitle}</h2>
      <p className="text-xs text-ink-muted">{dict.addStaffSubtitle}</p>

      <div>
        <label className="text-sm font-medium text-ink">{dict.fullNameLabel}</label>
        <input name="full_name" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-sm font-medium text-ink">{dict.emailLabel}</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
      </div>
      <select name="org_unit_id" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
        {orgUnits.map((ou) => (
          <option key={ou.id} value={ou.id}>
            {ou.name}
          </option>
        ))}
      </select>
      <select name="role" required className="w-full rounded-md border border-border px-3 py-2 text-sm">
        <option value="staff">{dict.roleStaff}</option>
        <option value="office_manager">{dict.roleOfficeManager}</option>
        <option value="head">{dict.roleHead}</option>
      </select>

      <div>
        <label className="text-sm font-medium text-ink">{dict.positionTemplateLabel}</label>
        <select name="position_type_id" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
          <option value="">{dict.positionTemplateNone}</option>
          {orgUnits.map((ou) => {
            const types = typesByOrgUnit.get(ou.id) ?? [];
            if (types.length === 0) return null;
            return (
              <optgroup key={ou.id} label={ou.name}>
                {types.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.title}
                    {pt.grade_band.length > 0 ? ` (${pt.grade_band.join("/")})` : ""}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-ink">{dict.gradeLabel}</label>
        <input name="grade" placeholder={dict.gradePlaceholder} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
      </div>

      {state.error ? <p className="text-sm text-ecowas-deep-red">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {dict.createAccount}
      </button>

      {state.tempPassword ? (
        <div className="rounded-md border border-ecowas-yellow/50 bg-ecowas-yellow/10 p-3 text-sm">
          <p className="font-medium text-ecowas-brown">{dict.tempPasswordLabel}</p>
          <p className="mt-1 select-all font-mono text-base text-ink">{state.tempPassword}</p>
          <p className="mt-1 text-xs text-ecowas-brown">{dict.tempPasswordNote}</p>
        </div>
      ) : null}
    </form>
  );
}
