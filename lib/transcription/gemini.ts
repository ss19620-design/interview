import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  TranscriptionInput,
  TranscriptionProvider,
  TranscriptionResult,
} from "./provider";

function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export class GeminiTranscriptionProvider implements TranscriptionProvider {
  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (input.typedFallback && !input.audioBase64) {
      return { text: normalizeText(input.typedFallback), provider: "stub" };
    }

    if (!input.audioBase64 || !input.mimeType) {
      const fallback = input.typedFallback ? normalizeText(input.typedFallback) : "";
      return { text: fallback, provider: "stub" };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = input.typedFallback ? normalizeText(input.typedFallback) : "";
      return { text: fallback, provider: "stub" };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt =
        "Transcribe the provided audio to plain text. " +
        "Return only the transcript, no extra words, no timestamps.";

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.audioBase64,
          },
        },
      ]);

      const text = normalizeText(result.response.text() ?? "");
      if (!text) {
        const fallback = input.typedFallback ? normalizeText(input.typedFallback) : "";
        return { text: fallback, provider: "stub" };
      }

      return { text, provider: "gemini" };
    } catch {
      const fallback = input.typedFallback ? normalizeText(input.typedFallback) : "";
      return { text: fallback, provider: "stub" };
    }
  }
}

