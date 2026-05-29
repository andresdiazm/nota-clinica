"use client";

import type { CaseStatus } from "@/lib/types";
import { statusLabels } from "@/components/StatusBadge";

const statuses: CaseStatus[] = ["PENDING", "IN_REVIEW", "RESOLVED", "ARCHIVED"];

export function StatusControls({
  value,
  disabled,
  onChange
}: {
  value: CaseStatus;
  disabled?: boolean;
  onChange: (status: CaseStatus) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          disabled={disabled || value === status}
          onClick={() => onChange(status)}
          className={`min-h-11 rounded-md border px-3 text-sm font-medium ${
            value === status
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-800"
          }`}
        >
          {statusLabels[status]}
        </button>
      ))}
    </div>
  );
}
