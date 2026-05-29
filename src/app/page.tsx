"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { CaseCard } from "@/components/CaseCard";
import type { CaseStatus, ClinicalCase } from "@/lib/types";

const filters: Array<{ value: "ALL" | CaseStatus; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "IN_REVIEW", label: "En revision" },
  { value: "RESOLVED", label: "Resueltos" },
  { value: "ARCHIVED", label: "Archivados" }
];

export default function HomePage() {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [status, setStatus] = useState<"ALL" | CaseStatus>("PENDING");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (query.trim()) params.set("q", query.trim());
    return `/api/cases?${params.toString()}`;
  }, [query, status]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar la bandeja");
        return response.json();
      })
      .then((data: { cases: ClinicalCase[] }) => {
        if (active) setCases(data.cases);
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
  }, [url]);

  return (
    <div className="space-y-4 pb-20">
      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium text-zinc-500">Bandeja de casos</p>
          <h1 className="text-2xl font-bold tracking-normal text-zinc-950">Seguimiento por cama</h1>
        </div>
        <label className="flex min-h-12 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 shadow-sm">
          <Search size={18} className="shrink-0 text-zinc-500" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cama: 601-2, UTI-7"
            className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`h-10 shrink-0 rounded-md border px-3 text-sm font-medium ${
                status === filter.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <section className="space-y-3">
        {loading ? (
          <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Cargando casos...</p>
        ) : cases.length > 0 ? (
          cases.map((item) => <CaseCard key={item.id} item={item} />)
        ) : (
          <div className="rounded-md border border-zinc-200 bg-white p-5 text-sm leading-6 text-zinc-600">
            No hay casos para este filtro.
          </div>
        )}
      </section>

      <Link
        href="/new"
        className="fixed bottom-5 right-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg"
        aria-label="Nuevo caso"
        title="Nuevo caso"
      >
        <Plus size={26} aria-hidden />
      </Link>
    </div>
  );
}
