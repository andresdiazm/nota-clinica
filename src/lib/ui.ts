import type { CaseStatus, Priority } from "@/lib/types";

export const statusLabels: Record<CaseStatus, string> = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revision",
  RESOLVED: "Resuelto",
  ARCHIVED: "Archivado"
};

export const priorityLabels: Record<Priority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta"
};

export const statusStyles: Record<CaseStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  IN_REVIEW: "bg-sky-100 text-sky-900 border-sky-200",
  RESOLVED: "bg-emerald-100 text-emerald-900 border-emerald-200",
  ARCHIVED: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

export function relativeAge(date: Date | string) {
  const then = new Date(date).getTime();
  const diff = Date.now() - then;
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

export function formatDateTime(date: Date | string | null) {
  if (!date) return "Sin cierre";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(date));
}
