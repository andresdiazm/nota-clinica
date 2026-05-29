"use client";

import { AlertTriangle } from "lucide-react";
import { sensitiveWarningReasons } from "@/lib/privacy";

export function SensitiveAlert({ text }: { text: string }) {
  const reasons = sensitiveWarningReasons(text);

  if (reasons.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden />
        <div>
          <p className="font-semibold">Revise posible dato sensible antes de guardar.</p>
          <p className="mt-1 text-amber-900">{reasons.join(", ")}.</p>
        </div>
      </div>
    </div>
  );
}
