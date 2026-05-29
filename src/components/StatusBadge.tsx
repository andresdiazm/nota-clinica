import type { CaseStatus } from "@/lib/types";

const labels: Record<CaseStatus, string> = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revision",
  RESOLVED: "Resuelto",
  ARCHIVED: "Archivado"
};

const styles: Record<CaseStatus, string> = {
  PENDING: "border-amber-200 bg-amber-100 text-amber-900",
  IN_REVIEW: "border-sky-200 bg-sky-100 text-sky-900",
  RESOLVED: "border-emerald-200 bg-emerald-100 text-emerald-900",
  ARCHIVED: "border-zinc-200 bg-zinc-100 text-zinc-700"
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export { labels as statusLabels };
