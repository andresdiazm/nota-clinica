"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Archive, Bed, CalendarClock, Trash2 } from "lucide-react";
import { SensitiveAlert } from "@/components/SensitiveAlert";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusControls } from "@/components/StatusControls";
import type { CaseStatus, ClinicalCaseDetail } from "@/lib/types";
import { formatDateTime } from "@/lib/ui";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ClinicalCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/cases/${params.id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Caso no encontrado");
        return response.json();
      })
      .then((data: { case: ClinicalCaseDetail }) => {
        if (active) setItem(data.case);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  async function updateStatus(status: CaseStatus) {
    if (!item) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/cases/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo actualizar");

      const refreshed = await fetch(`/api/cases/${item.id}`).then((res) => res.json());
      setItem(refreshed.case);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCase() {
    if (!item) return;
    const confirmed = window.confirm("Eliminar este caso de la bandeja?");
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/cases/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("No se pudo eliminar");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Cargando caso...</p>;
  }

  if (!item) {
    return <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Bed size={17} aria-hidden />
              Cama
            </div>
            <h1 className="mt-1 break-words text-4xl font-bold tracking-normal text-zinc-950">{item.bed}</h1>
          </div>
          <StatusBadge status={item.status} />
        </div>
        {item.sensitiveWarning ? (
          <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 shrink-0" size={17} aria-hidden />
            Este caso fue guardado con alerta de posible dato sensible.
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800">Transcripcion</h2>
        <p className="whitespace-pre-wrap rounded-md border border-zinc-200 bg-white p-4 text-base leading-7 text-zinc-800">
          {item.transcript}
        </p>
        <SensitiveAlert text={item.transcript} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-800">Estado</h2>
        <StatusControls value={item.status} disabled={saving} onChange={updateStatus} />
      </section>

      <section className="grid gap-2 rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        <div className="flex items-center gap-2 font-semibold text-zinc-900">
          <CalendarClock size={17} aria-hidden />
          Fechas
        </div>
        <p>Creado: {formatDateTime(item.createdAt)}</p>
        <p>Actualizado: {formatDateTime(item.updatedAt)}</p>
        <p>Cierre: {formatDateTime(item.closedAt)}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800">Historial</h2>
        <div className="space-y-2">
          {item.auditLogs.map((log) => (
            <div key={log.id} className="rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-zinc-900">{log.action}</span>
                <span className="text-xs text-zinc-500">{formatDateTime(log.createdAt)}</span>
              </div>
              {log.actor ? <p className="mt-1 text-xs text-zinc-500">Actor: {log.actor}</p> : null}
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => updateStatus("ARCHIVED")}
          disabled={saving || item.status === "ARCHIVED"}
          className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800"
        >
          <Archive size={18} aria-hidden />
          Archivar
        </button>
        <button
          type="button"
          onClick={deleteCase}
          disabled={saving}
          className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-700 px-3 text-sm font-semibold text-white"
        >
          <Trash2 size={18} aria-hidden />
          Eliminar
        </button>
      </div>
    </div>
  );
}
