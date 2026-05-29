"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, RotateCcw, Save, Square, Trash2 } from "lucide-react";
import { SensitiveAlert } from "@/components/SensitiveAlert";

type RecorderState = "ready" | "recording" | "processing" | "done";

export default function NewCasePage() {
  const router = useRouter();
  const [bed, setBed] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recorderState, setRecorderState] = useState<RecorderState>("ready");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [micMessage, setMicMessage] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const canSave = bed.trim().length > 0 && transcript.trim().length > 0 && transcript.length <= 1000;
  const canRecord = micMessage.length === 0 && recorderState !== "processing";
  const countStyle = transcript.length > 1000 ? "text-red-700" : "text-zinc-500";

  const helperText = useMemo(() => {
    if (recorderState === "recording") return "Grabando nota breve...";
    if (recorderState === "processing") return "Procesando transcripcion...";
    if (recorderState === "done") return "Transcripcion lista para revisar.";
    return "Listo para grabar.";
  }, [recorderState]);

  useEffect(() => {
    if (!window.isSecureContext) {
      setMicMessage("El microfono requiere HTTPS. Use localhost en este equipo o una URL https para probar en celular.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicMessage("Este navegador no expone acceso al microfono. Pruebe en Chrome, Edge o Safari actualizado.");
      return;
    }

    setMicMessage("");
  }, []);

  async function startRecording() {
    setError("");
    if (micMessage) {
      setError(micMessage);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return url;
        });
        await transcribe(blob);
      };

      recorder.start();
      setRecorderState("recording");
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Permiso de microfono denegado. Revise permisos del sitio en el navegador.");
          return;
        }
        if (err.name === "NotFoundError") {
          setError("No se encontro un microfono disponible en este dispositivo.");
          return;
        }
        if (err.name === "NotReadableError") {
          setError("El microfono esta ocupado por otra aplicacion o el sistema lo bloqueo.");
          return;
        }
      }

      setError("No se pudo acceder al microfono. Pruebe con HTTPS y revise permisos del navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecorderState("processing");
  }

  async function transcribe(blob: Blob) {
    setError("");
    setRecorderState("processing");
    const formData = new FormData();
    formData.append("audio", blob, "voice-note.webm");

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
      setAudioBlob(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo transcribir");
      setRecorderState("ready");
    }
  }

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscript("");
    setMode(null);
    setRecorderState("ready");
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

      if (audioUrl) URL.revokeObjectURL(audioUrl);
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
        No mencione nombre, RUT ni otros datos identificatorios. Registre solo una nota breve para orientar revision
        posterior en el RCE.
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-zinc-800">Cama</span>
        <input
          value={bed}
          onChange={(event) => setBed(event.target.value)}
          placeholder="601-2, 604/1, UTI-7, NEO 3"
          className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-lg font-semibold uppercase outline-none focus:border-zinc-900"
          required
        />
      </label>

      <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Nota de voz</p>
            <p className="text-sm text-zinc-500">{helperText}</p>
          </div>
          {mode ? <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">Modo {mode}</span> : null}
        </div>

        <div className="mt-4 grid gap-3">
          {recorderState === "recording" ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex min-h-16 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-base font-semibold text-white"
            >
              <Square size={22} aria-hidden />
              Detener
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={!canRecord}
              className="flex min-h-16 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-base font-semibold text-white"
            >
              <Mic size={24} aria-hidden />
              Grabar
            </button>
          )}

          {micMessage ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              {micMessage}
            </p>
          ) : null}

          {audioUrl && audioBlob ? (
            <audio className="w-full" controls src={audioUrl}>
              <track kind="captions" />
            </audio>
          ) : null}
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
          onChange={(event) => setTranscript(event.target.value.slice(0, 1000))}
          placeholder="La transcripcion aparecera aqui. Revise y elimine informacion sensible antes de guardar."
          className="min-h-40 w-full resize-y rounded-md border border-zinc-300 bg-white p-3 text-base leading-6 outline-none focus:border-zinc-900"
          maxLength={1000}
        />
      </section>

      <SensitiveAlert text={transcript} />

      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={saveCase}
          disabled={!canSave || saving}
          className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white"
        >
          <Save size={18} aria-hidden />
          Guardar
        </button>
        <button
          type="button"
          onClick={resetRecording}
          className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800"
          title="Regrabar"
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
