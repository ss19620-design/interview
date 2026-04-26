"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function joinParts(a: string, b: string) {
  const left = a.trim();
  const right = b.trim();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}

export function VoiceInput(props: {
  value?: string;
  onChange?: (next: string) => void;
  disabled?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
  hideLiveText?: boolean;
  onFinalTranscript?: (finalText: string) => void;
  variant?: "default" | "hirevue";
}) {
  const ctor = useMemo(getSpeechRecognitionCtor, []);
  const supported = !!ctor;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const stopRequestedAtRef = useRef<number | null>(null);

  const [isRecordingUi, setIsRecordingUi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setRecording(next: boolean) {
    isRecordingRef.current = next;
    setIsRecordingUi(next);
    props.onRecordingChange?.(next);
  }

  function updateTextboxLive() {
    const combined = joinParts(finalTranscriptRef.current, interimTranscriptRef.current);
    if (!props.hideLiveText) props.onChange?.(combined);
  }

  function initRecognition() {
    if (!ctor) return null;
    const recognition = new ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    return recognition;
  }

  function ensureRecognition() {
    if (recognitionRef.current) return recognitionRef.current;
    recognitionRef.current = initRecognition();
    return recognitionRef.current;
  }

  async function start() {
    if (!supported || props.disabled) return;
    setError(null);

    finalTranscriptRef.current = (props.value ?? "").trim();
    interimTranscriptRef.current = "";
    stopRequestedAtRef.current = null;
    updateTextboxLive();

    const recognition = ensureRecognition();
    if (!recognition) {
      setError("Voice typing is not supported in this browser.");
      return;
    }

    recognition.onresult = (event) => {
      let interim = "";
      let appendedFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = (res[0]?.transcript ?? "").trim();
        if (!text) continue;
        if (res.isFinal) appendedFinal = joinParts(appendedFinal, text);
        else interim = joinParts(interim, text);
      }

      if (appendedFinal) finalTranscriptRef.current = joinParts(finalTranscriptRef.current, appendedFinal);
      interimTranscriptRef.current = interim;
      updateTextboxLive();
    };

    recognition.onerror = () => {
      setError("Voice typing encountered an error. You can keep typing, or try again.");
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          setTimeout(() => {
            if (isRecordingRef.current) {
              try { recognition.start(); } catch {}
            }
          }, 250);
        }
        return;
      }

      const requestedAt = stopRequestedAtRef.current;
      if (requestedAt) {
        const elapsed = Date.now() - requestedAt;
        const remaining = Math.max(0, 700 - elapsed);
        setTimeout(() => {
          interimTranscriptRef.current = "";
          updateTextboxLive();
          props.onFinalTranscript?.(finalTranscriptRef.current.trim());
        }, remaining);
      }
    };

    try {
      recognition.start();
      setRecording(true);
    } catch {
      setError("Could not start voice typing. Please try again.");
      setRecording(false);
    }
  }

  async function stop() {
    if (!supported) return;
    setError(null);
    setRecording(false);
    stopRequestedAtRef.current = Date.now();
    interimTranscriptRef.current = "";
    try { recognitionRef.current?.stop(); } catch {}
  }

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, []);

  if (!supported) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="text-sm font-medium text-foreground">Voice typing unavailable</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Your browser doesn&apos;t support the Web Speech API. You can type your answer instead.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Voice</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Tap to start. Tap to stop. We&apos;ll keep listening through short pauses.
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRecordingUi ? (
            <button
              type="button"
              onClick={() => void start()}
              disabled={props.disabled}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
            >
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground/90" />
              Start
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void stop()}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/20"
            >
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
              </span>
              Stop
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
