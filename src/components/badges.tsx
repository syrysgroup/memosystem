import type { DocumentStatus } from "@/lib/supabase/types";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  dispatched: "bg-purple-100 text-purple-800",
  closed: "bg-slate-200 text-slate-600",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  dispatched: "Dispatched",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-slate-400">—</span>;
  const overdue = days >= 5;
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${overdue ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
      {days} day{days === 1 ? "" : "s"}
    </span>
  );
}
