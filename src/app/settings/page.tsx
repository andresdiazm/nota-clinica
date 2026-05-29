import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Configuracion</p>
        <h1 className="text-2xl font-bold tracking-normal text-zinc-950">Uso y privacidad</h1>
      </div>

      <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 shrink-0 text-emerald-700" size={22} aria-hidden />
          <div className="space-y-2 text-sm leading-6 text-zinc-700">
            <h2 className="text-base font-semibold text-zinc-950">Politica breve de uso</h2>
            <p>
              Esta PWA registra focos operacionales identificados solo por cama. No debe almacenar nombre, RUT,
              diagnostico, tratamiento, evolucion ni otros datos clinicos formales.
            </p>
            <p>
              La nota de voz se usa temporalmente para transcribir y se descarta en el frontend despues de recibir el
              texto. La base de datos guarda cama, transcripcion revisada, estado, fechas y auditoria minima.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-700 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-950">Modo de transcripcion</h2>
        <p className="mt-2">
          Estado actual:{" "}
          <span className="font-semibold text-zinc-950">{hasKey ? "real con OPENAI_API_KEY" : "mock local"}</span>.
        </p>
      </section>

      <section className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Antes de grabar, recuerde no mencionar nombre, RUT ni otros datos identificatorios. Antes de guardar, revise la
        transcripcion y borre cualquier informacion sensible.
      </section>
    </div>
  );
}
