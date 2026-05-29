import Link from "next/link";
import { AlertTriangle, Bed, Clock3 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { ClinicalCase } from "@/lib/types";
import { relativeAge } from "@/lib/ui";

export function CaseCard({ item }: { item: ClinicalCase }) {
  return (
    <Link
      href={`/cases/${item.id}`}
      className="block rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Bed size={15} aria-hidden />
            Cama
          </div>
          <h2 className="mt-1 break-words text-3xl font-bold tracking-normal text-zinc-950">{item.bed}</h2>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-700">{item.transcript}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Clock3 size={14} aria-hidden />
          {relativeAge(item.createdAt)}
        </span>
        {item.sensitiveWarning ? (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <AlertTriangle size={14} aria-hidden />
            Revisar texto
          </span>
        ) : null}
      </div>
    </Link>
  );
}
