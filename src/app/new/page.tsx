"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, RotateCcw, Save, Square, Trash2 } from "lucide-react";
import { SensitiveAlert } from "@/components/SensitiveAlert";

type RecorderState = "ready" | "recording" | "processing" | "done";

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg"
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

function mimeToExtension(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

const CAMAS = ["1", "2", "3", "4", "5", "6"];

export default function NewCasePage() {
  const router = useRouter();
  const [sala, setSala] = useState("");
  const [cama, setCama] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recorderState, setRecorderState] = useState<RecorderState>("ready");
  const [autoDetected, setAutoDetected] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const bed = sala.trim() && cama ? `${sala.trim().toUpperCase()}-${cama}` : "";
  const canSave = bed.length > 0 && transcript.trim().length > 0 && transcript.length <= 1000;
  const countStyle = transcript.length > 1000 ? "text-red-700" : "text-zinc-500";

  const helperText = {
    ready: "Listo para grabar.",
    recording: "Grabando nota breve...",
    processing: "Procesando transcripcion...",
    done: "Transcripcion lista para revisar."
  }[recorderState];

  async function sendAudioForTranscription(blob: Blob, mimeType: string) {
    setRecorderState("processing");
    setError("");

    const ext = mimeToExtension(mimeType);
    const formData = new FormData();
    formData.append("audio", blob, `voice-note.${ext}`);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo transcribir");

      setTranscript((data.transcript ?? "").slice(0, 1000));
      setMode(data.mode ?? null);

      if (data.sala) { setSala(data.sala); setAutoDetected(true); }
      if (data.cama) { setCama(data.cama); setAutoDetected(true); }

      setRecorderState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo transcribir");
      setRecorderState("ready");
    }
  }

  async function startRecording() {
    setError("");
    const mimeType = getSupportedMimeType();

    if (!mimeType) {
      setError("Este navegador no soporta grabacion de audio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await sendAudioForTranscription(blob, mimeType);
      };

      recorder.start();
      setRecorderState("recording");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Permiso de microfono denegado. Revise los permisos del sitio en su navegador.");
      } else {
        setError("No se pudo acceder al microfono.");
      }
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecorderState("processing");
  }

  function reset() {
    setTranscript("");
    setMode(null);
    setRecorderState("ready");
    setAutoDetected(false);
    setSala("");
    setCama("");
    setError("");
  }

  async function saveCase() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bed, transcript })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar");
      router.push(`/cases/${data.case.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Nuevo caso</p>
        <h1 className="text-2xl font-bold tracking-normal text-zinc-950">Captura rapida</h1>
      </div>

      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
        No mencione nombre, RUT ni otros datos identificatorios. Solo una nota breve por cama.
      </div>

      {/* Grabacion */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Nota de voz</p>
            <p className="text-sm text-zinc-500">{helperText}</p>
          </div>
          {mode ? (
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
              Modo {mode}
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          {recorderState === "recording" ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex min-h-16 w-full items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-base font-semibold text-white"
            >
              <Square size={22} aria-hidden />
              Detener grabacion
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={recorderState === "processing"}
              className="flex min-h-16 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-base font-semibold text-white disabled:opacity-50"
            >
              <Mic size={24} aria-hidden />
              {recorderState === "processing" ? "Procesando..." : "Grabar"}
            </button>
          )}
        </div>
      </section>

      {/* Validacion sala-cama */}
      <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">Ubicacion</p>
          {autoDetected ? (
            <span className="text-xs text-emerald-700 font-medium">✓ Detectada automaticamente</span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Sala</label>
            <input
              value={sala}
              onChange={(e) => { setSala(e.target.value); setAutoDetected(false); }}
              placeholder="601, UTI, NEO"
              className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-base font-semibold uppercase outline-none focus:border-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Cama (1-6)</label>
            <select
              value={cama}
              onChange={(e) => { setCama(e.target.value); setAutoDetected(false); }}
              className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-base font-semibold outline-none focus:border-zinc-900"
            >
              <option value="">—</option>
              {CAMAS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {bed ? (
          <div className="rounded-md bg-zinc-50 border border-zinc-200 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Identificador final</span>
            <span className="text-xl font-bold tracking-wide text-zinc-950">{bed}</span>
          </div>
        ) : null}
      </section>

      {/* Transcripcion */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="transcript" className="text-sm font-semibold text-zinc-800">
            Transcripcion editable
          </label>
          <span className={`text-xs ${countStyle}`}>{transcript.length}/1000</span>
        </div>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value.slice(0, 1000))}
          placeholder="La transcripcion aparece aqui. Revise y elimine informacion sensible antes de guardar."
          className="min-h-40 w-full resize-y rounded-md border border-zinc-300 bg-white p-3 text-base leading-6 outline-none focus:border-zinc-900"
          maxLength={1000}
        />
      </section>

      <SensitiveAlert text={transcript} />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={saveCase}
          disabled={!canSave || saving}
          className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save size={18} aria-hidden />
          Guardar
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800"
        >
          <RotateCcw size={18} aria-hidden />
          Regrabar
        </button>
      </div>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700"
      >
        <Trash2 size={17} aria-hidden />
        Descartar
      </button>
    </div>
  );
}
