import type { Dictionary } from "@/lib/i18n/dictionary";
import type { PositionRole } from "@/lib/supabase/types";

export function roleLabel(role: PositionRole, dict: Dictionary): string {
  switch (role) {
    case "head":
      return dict.dashboard.roleHead;
    case "office_manager":
      return dict.dashboard.roleOfficeManager;
    case "staff":
      return dict.dashboard.roleStaff;
  }
}

function namedRoleLabels(dict: Dictionary): Record<string, string> {
  return {
    sg: dict.dashboard.namedRoleSg,
    director_admin_finance: dict.dashboard.namedRoleDirectorAdminFinance,
    head_hr: dict.dashboard.namedRoleHeadHr,
  };
}

export function namedRoleLabel(namedRole: string | null, dict: Dictionary): string | null {
  if (!namedRole) return null;
  return namedRoleLabels(dict)[namedRole] ?? namedRole;
}

export function scopeDescription(role: PositionRole, orgUnitName: string, dict: Dictionary): string {
  switch (role) {
    case "head":
      return dict.dashboard.scopeHead(orgUnitName);
    case "office_manager":
      return dict.dashboard.scopeOfficeManager(orgUnitName);
    case "staff":
      return dict.dashboard.scopeStaff(orgUnitName);
  }
}
