"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, RotateCcw, Save, Square, Trash2, Upload } from "lucide-react";
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

export default function NewCasePage() {
  const router = useRouter();
  const [bed, setBed] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recorderState, setRecorderState] = useState<RecorderState>("ready");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSave = bed.trim().length > 0 && transcript.trim().length > 0 && transcript.length <= 1000;
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
      setError("Este navegador no soporta grabacion de audio. Use el boton de subir archivo.");
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
        setError("No se pudo acceder al microfono. Intente subir un archivo de audio.");
      }
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecorderState("processing");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    await sendAudioForTranscription(file, file.type || "audio/mp4");
    e.target.value = "";
  }

  function reset() {
    setTranscript("");
    setMode(null);
    setRecorderState("ready");
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

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-800">Cama</span>
        <input
          value={bed}
          onChange={(e) => setBed(e.target.value)}
          placeholder="601-2, 604/1, UTI-7, NEO 3"
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-lg font-semibold uppercase outline-none focus:border-zinc-900"
        />
      </label>

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

        <div className="mt-4 grid gap-3">
          {recorderState === "recording" ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex min-h-16 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-base font-semibold text-white"
            >
              <Square size={22} aria-hidden />
              Detener grabacion
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={recorderState === "processing"}
              className="flex min-h-16 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-base font-semibold text-white disabled:opacity-50"
            >
              <Mic size={24} aria-hidden />
              Grabar
            </button>
          )}

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              capture="microphone"
              onChange={handleFileUpload}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={recorderState === "processing" || recorderState === "recording"}
            />
            <div className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700">
              <Upload size={18} aria-hidden />
              Subir audio / grabar con app del cel
            </div>
          </div>
        </div>
      </section>

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
