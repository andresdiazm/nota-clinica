import { NextResponse } from "next/server";
import { sensitiveWarningReasons } from "@/lib/privacy";

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Audio requerido" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const mockText =
      "Revisar pendiente asociado a la cama indicada durante la proxima ronda operacional.";

    return NextResponse.json({
      transcript: mockText,
      mode: "mock",
      sensitiveWarning: false,
      warningReasons: []
    });
  }

  try {
    const body = new FormData();
    body.append("file", audio, audio.name || "voice-note.webm");
    body.append("model", "whisper-large-v3-turbo");
    body.append("language", "es");
    body.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("Groq error", response.status, JSON.stringify(errorBody));
      return NextResponse.json({ error: "No se pudo transcribir el audio" }, { status: 502 });
    }

    const result = (await response.json()) as { text?: string };
    const transcript = result.text?.trim() ?? "";

    return NextResponse.json({
      transcript,
      mode: "real",
      sensitiveWarning: sensitiveWarningReasons(transcript).length > 0,
      warningReasons: sensitiveWarningReasons(transcript)
    });
  } catch {
    return NextResponse.json({ error: "Error de transcripcion" }, { status: 500 });
  }
}
