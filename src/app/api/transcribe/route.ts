import { NextResponse } from "next/server";
import { sensitiveWarningReasons } from "@/lib/privacy";

type BedExtraction = { sala: string | null; cama: string | null };

async function extractBed(transcript: string, apiKey: string): Promise<BedExtraction> {
  const empty: BedExtraction = { sala: null, cama: null };
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
        max_tokens: 40,
        messages: [
          {
            role: "system",
            content:
              "Eres un extractor de ubicacion hospitalaria. " +
              "Del texto clinico extrae: sala (puede ser numerica como 601, 604, o alfanumerica como UTI, NEO, UCI, PEDIATRIA) " +
              "y numero de cama (siempre un numero del 1 al 6). " +
              "Responde SOLO con JSON valido, sin explicaciones: " +
              "{\"sala\": \"UTI\", \"cama\": \"3\"} " +
              "Si no se detecta sala o cama usa null: {\"sala\": null, \"cama\": null}"
          },
          {
            role: "user",
            content: transcript
          }
        ]
      })
    });

    if (!response.ok) return empty;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as BedExtraction;
    return {
      sala: parsed.sala ? String(parsed.sala).toUpperCase().trim().slice(0, 20) : null,
      cama: parsed.cama ? String(parsed.cama).trim().slice(0, 2) : null
    };
  } catch {
    return empty;
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
      sala: "UTI",
      cama: "3",
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

    const { sala, cama } = await extractBed(transcript, apiKey);
    const bed = sala && cama ? `${sala}-${cama}` : null;

    return NextResponse.json({
      transcript,
      bed,
      sala,
      cama,
      mode: "real",
      sensitiveWarning: sensitiveWarningReasons(transcript).length > 0,
      warningReasons: sensitiveWarningReasons(transcript)
    });
  } catch {
    return NextResponse.json({ error: "Error de transcripcion" }, { status: 500 });
  }
}
