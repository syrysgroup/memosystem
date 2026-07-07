import type { PositionRole } from "@/lib/supabase/types";

export function roleLabel(role: PositionRole): string {
  switch (role) {
    case "head":
      return "Head";
    case "office_manager":
      return "Office Manager";
    case "staff":
      return "Staff";
  }
}

const NAMED_ROLE_LABELS: Record<string, string> = {
  sg: "Secretary-General",
  director_admin_finance: "Director, Admin & Finance",
  head_hr: "Head of HR",
};

export function namedRoleLabel(namedRole: string | null): string | null {
  if (!namedRole) return null;
  return NAMED_ROLE_LABELS[namedRole] ?? namedRole;
}

export function scopeDescription(role: PositionRole, orgUnitName: string): string {
  switch (role) {
    case "head":
      return `You oversee ${orgUnitName} and everything beneath it in the organogram.`;
    case "office_manager":
      return `You manage day-to-day routing for ${orgUnitName}.`;
    case "staff":
      return `You handle documents assigned directly to your position at ${orgUnitName}.`;
  }
}
