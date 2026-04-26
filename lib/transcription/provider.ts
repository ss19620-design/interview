export type TranscriptionInput =
  | {
      audioBase64: string;
      mimeType: string;
      typedFallback?: string;
    }
  | {
      audioBase64?: undefined;
      mimeType?: undefined;
      typedFallback: string;
    };

export type TranscriptionResult = {
  text: string;
  provider: "gemini" | "stub";
};

export interface TranscriptionProvider {
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}

