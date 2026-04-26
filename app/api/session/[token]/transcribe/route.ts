import { NextResponse } from "next/server";
import { GeminiTranscriptionProvider } from "@/lib/transcription/gemini";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<{
    audioBase64: string;
    mimeType: string;
    typedText: string;
  }>;

  const provider = new GeminiTranscriptionProvider();
  const res = await provider.transcribe(
    body.audioBase64 && body.mimeType
      ? {
          audioBase64: body.audioBase64,
          mimeType: body.mimeType,
          typedFallback: body.typedText,
        }
      : {
          typedFallback: body.typedText ?? "",
        },
  );

  return NextResponse.json({ transcript: res.text, provider: res.provider });
}

