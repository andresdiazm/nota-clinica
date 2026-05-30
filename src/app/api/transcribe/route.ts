import { NextResponse } from "next/server";
import { sensitiveWarningReasons } from "@/lib/privacy";

async function extractBed(transcript: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0,
        max_tokens: 20,
        messages: [
          {
            role: "system",
            content:
              "Eres un extractor de identificadores de cama hospitalaria. " +
              "Extrae el identificador de cama del texto clinico. " +
              "Puede ser: numero de cama (601-2, 604/1), unidad con numero (UTI-7, UTI 7, NEO 3, NEO-3), sala con numero (sala 3). " +
              "Responde SOLO con el identificador corto y estandarizado (ej: '601-2', 'UTI-7', 'NEO-3', 'SALA-3'). " +
              "Si no se menciona ninguna cama responde exactamente: null"
          },
          {
            role: "user",
            content: transcript
          }
        ]
      })
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw || raw.toLowerCase() === "null") return null;
    return raw.slice(0, 40);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Audio requerido" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const mockText =
      "Cama UTI-3, revisar pendiente asociado a la cama indicada durante la proxima ronda operacional.";

    return NextResponse.json({
      transcript: mockText,
      bed: "UTI-3",
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

    const bed = await extractBed(transcript, apiKey);

    return NextResponse.json({
      transcript,
      bed,
      mode: "real",
      sensitiveWarning: sensitiveWarningReasons(transcript).length > 0,
      warningReasons: sensitiveWarningReasons(transcript)
    });
  } catch {
    return NextResponse.json({ error: "Error de transcripcion" }, { status: 500 });
  }
}
