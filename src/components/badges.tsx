import type { Dictionary } from "@/lib/i18n/dictionary";
import type { DecisionStatus, DigitalStatus, PhysicalStatus, RequesterTier } from "@/lib/supabase/types";

export const OVERDUE_THRESHOLD_DAYS = 5;

// Coloured with the ECOWAS Corporate Design Manual's secondary palette
// (p.11): sky/ocean blue for in-progress states, green for completed/
// favourable outcomes, deep red for failures/rejections, yellow for
// pending attention.
const DIGITAL_STYLES: Record<DigitalStatus, string> = {
  drafted: "bg-border/60 text-ink-muted",
  in_transit: "bg-ecowas-sky-blue/20 text-ecowas-ocean-blue",
  at_office: "bg-border/60 text-ink-muted",
  under_review: "bg-ecowas-yellow/25 text-ecowas-brown",
  minuted: "bg-ecowas-blue-grey/20 text-ecowas-blue-grey",
  decided: "bg-ecowas-green-tint text-ecowas-green",
  reassigned: "bg-ecowas-orange/20 text-ecowas-orange",
};

const PHYSICAL_STYLES: Record<PhysicalStatus, string> = {
  not_dispatched: "bg-border/60 text-ink-muted",
  in_transit: "bg-ecowas-sky-blue/20 text-ecowas-ocean-blue",
  delivered: "bg-ecowas-green-tint text-ecowas-green",
  delivery_failed: "bg-ecowas-deep-red/15 text-ecowas-deep-red",
};

const DECISION_STYLES: Record<DecisionStatus, string> = {
  open: "bg-border/60 text-ink-muted",
  pending_decision: "bg-ecowas-yellow/25 text-ecowas-brown",
  approved: "bg-ecowas-green-tint text-ecowas-green",
  rejected: "bg-ecowas-deep-red/15 text-ecowas-deep-red",
  withdrawn: "bg-border/60 text-ink-muted",
};

export function DigitalStatusBadge({ status, labels }: { status: DigitalStatus; labels: Dictionary["badges"]["digital"] }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${DIGITAL_STYLES[status]}`}>
      {labels[status]}
    </span>
  );
}

export function PhysicalStatusBadge({ status, labels }: { status: PhysicalStatus; labels: Dictionary["badges"]["physical"] }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${PHYSICAL_STYLES[status]}`}>
      {labels[status]}
    </span>
  );
}

export function DecisionStatusBadge({ status, labels }: { status: DecisionStatus; labels: Dictionary["badges"]["decision"] }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${DECISION_STYLES[status]}`}>
      {labels[status]}
    </span>
  );
}

export function TierBadge({ tier, labels }: { tier: RequesterTier; labels: Dictionary["badges"]["tier"] }) {
  return (
    <span className="inline-block rounded bg-ecowas-brown/15 px-2 py-0.5 text-xs font-medium text-ecowas-brown">
      {labels[tier]}
    </span>
  );
}

export function DaysBadge({ days, label, dict }: { days: number | null; label?: string; dict: Dictionary }) {
  if (days === null) return <span className="text-ink-muted">{dict.common.dash}</span>;
  const overdue = days >= OVERDUE_THRESHOLD_DAYS;
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        overdue ? "bg-ecowas-deep-red/15 text-ecowas-deep-red" : "bg-border/60 text-ink-muted"
      }`}
    >
      {dict.badges.days(days)}
      {label ? ` ${label}` : ""}
    </span>
  );
}
