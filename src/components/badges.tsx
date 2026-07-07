import type { DecisionStatus, DigitalStatus, PhysicalStatus, RequesterTier } from "@/lib/supabase/types";

export const OVERDUE_THRESHOLD_DAYS = 5;

const DIGITAL_STYLES: Record<DigitalStatus, string> = {
  drafted: "bg-slate-100 text-slate-600",
  in_transit: "bg-blue-100 text-blue-800",
  at_office: "bg-slate-100 text-slate-600",
  under_review: "bg-amber-100 text-amber-800",
  minuted: "bg-indigo-100 text-indigo-800",
  decided: "bg-emerald-100 text-emerald-800",
  reassigned: "bg-orange-100 text-orange-800",
};

const PHYSICAL_STYLES: Record<PhysicalStatus, string> = {
  not_dispatched: "bg-slate-100 text-slate-600",
  in_transit: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  delivery_failed: "bg-red-100 text-red-800",
};

const DECISION_STYLES: Record<DecisionStatus, string> = {
  open: "bg-slate-100 text-slate-600",
  pending_decision: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-slate-200 text-slate-600",
};

function labelize(s: string) {
  return s.replace(/_/g, " ");
}

export function DigitalStatusBadge({ status }: { status: DigitalStatus }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${DIGITAL_STYLES[status]}`}>
      {labelize(status)}
    </span>
  );
}

export function PhysicalStatusBadge({ status }: { status: PhysicalStatus }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${PHYSICAL_STYLES[status]}`}>
      {labelize(status)}
    </span>
  );
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${DECISION_STYLES[status]}`}>
      {labelize(status)}
    </span>
  );
}

export function TierBadge({ tier }: { tier: RequesterTier }) {
  return (
    <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
      {labelize(tier)}
    </span>
  );
}

export function DaysBadge({ days, label }: { days: number | null; label?: string }) {
  if (days === null) return <span className="text-slate-400">—</span>;
  const overdue = days >= OVERDUE_THRESHOLD_DAYS;
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${overdue ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
      {days} day{days === 1 ? "" : "s"}
      {label ? ` ${label}` : ""}
    </span>
  );
}
