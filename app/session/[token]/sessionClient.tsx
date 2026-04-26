"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { VoiceInput } from "@/components/voice-input";

type SessionPayload = {
  id: string;
  publicToken: string;
  consented: boolean;
  consentedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  project: {
    id: string;
    name: string;
    description: string;
    consentText: string;
    introScript: string;
    closingScript: string;
    maxFollowUps: number;
    questions: Array<{ id: string; orderIndex: number; text: string }>;
  };
};

type Stage =
  | "LOADING"
  | "CONSENT"
  | "INTRO"
  | "ASKING"
  | "RECORDING"
  | "SAVING"
  | "COMPLETE"
  | "ERROR";

export function SessionClient(props: { token: string }) {
  const [stage, setStage] = useState<Stage>("LOADING");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);

  const [qIndex, setQIndex] = useState(0);
  const [activeQuestionText, setActiveQuestionText] = useState<string | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [answer, setAnswer] = useState("");

  // Keep a ref so async saveResponse always reads the latest qIndex
  const qIndexRef = useRef(qIndex);
  qIndexRef.current = qIndex;

  const questions = session?.project.questions ?? [];
  const baseQuestion = questions[qIndex] ?? null;
  const displayedQuestionText = activeQuestionText ?? baseQuestion?.text ?? "";

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((qIndex + 1) / questions.length) * 100);
  }, [qIndex, questions.length]);

  async function load() {
    setStage("LOADING");
    setError(null);
    try {
      const res = await fetch(`/api/session/${props.token}`, { cache: "no-store" });
      const json = (await res.json()) as { session?: SessionPayload; error?: string };
      if (!res.ok || !json.session) throw new Error(json.error || "Session not found");
      setSession(json.session);
      setQIndex(0);
      setActiveQuestionText(null);
      setFollowUpCount(0);
      setAnswer("");
      setStage(json.session.consented ? "INTRO" : "CONSENT");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
      setStage("ERROR");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.token]);

  async function acceptConsent() {
    setError(null);
    try {
      const res = await fetch(`/api/session/${props.token}/consent`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to save consent");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save consent");
      setStage("CONSENT");
    }
  }

  function startInterview() {
    setError(null);
    if (!questions.length) {
      setError("This project has no questions yet.");
      return;
    }
    setStage("ASKING");
    setActiveQuestionText(null);
    setFollowUpCount(0);
    setAnswer("");
  }

  const saveResponse = useCallback(
    async (args: { transcript: string; skipped?: boolean }) => {
      if (!session || !baseQuestion) return;
      setStage("SAVING");
      setError(null);

      // Read the latest qIndex from the ref, not the closure
      const idx = qIndexRef.current;
      const total = session.project.questions.length;
      const isLast = idx >= total - 1;

      try {
        const res = await fetch(`/api/session/${props.token}/response`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: baseQuestion.id,
            questionText: displayedQuestionText,
            transcript: args.skipped ? "SKIPPED" : args.transcript,
            followUpCount,
            isLastQuestion: isLast,
            questionIndex: idx,
            totalQuestions: total,
          }),
        });
        const json = (await res.json()) as
          | { action: "next" }
          | { action: "complete" }
          | { action: "followup"; followUpQuestionText: string; nextFollowUpCount: number }
          | { error?: string };

        if (!res.ok) throw new Error((json as any).error || "Failed to save response");

        const action = (json as any).action as string;

        if (action === "followup") {
          const j = json as { followUpQuestionText: string; nextFollowUpCount: number };
          setActiveQuestionText(j.followUpQuestionText);
          setFollowUpCount(j.nextFollowUpCount);
          setAnswer("");
          setStage("ASKING");
          return;
        }

        // Complete if the server says so OR if we know we're on the last question
        if (action === "complete" || isLast) {
          setStage("COMPLETE");
          return;
        }

        // Advance to next base question
        const nextIdx = idx + 1;
        setQIndex(nextIdx);
        setActiveQuestionText(null);
        setFollowUpCount(0);
        setAnswer("");
        setStage("ASKING");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save response");
        setStage("ASKING");
      }
    },
    [session, baseQuestion, displayedQuestionText, followUpCount, props.token],
  );

  if (stage === "LOADING") {
    return (
      <CenteredShell>
        <Card>
          <div className="text-sm font-semibold text-muted-foreground">InterviewBot</div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-foreground">Loading…</div>
        </Card>
      </CenteredShell>
    );
  }

  if (stage === "ERROR" || !session) {
    return (
      <CenteredShell>
        <Card>
          <div className="text-sm font-semibold text-muted-foreground">InterviewBot</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Session unavailable
          </div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{error ?? "Not found"}</div>
          <button
            className="mt-5 inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            onClick={() => void load()}
          >
            Retry
          </button>
        </Card>
      </CenteredShell>
    );
  }

  if (stage === "CONSENT") {
    return (
      <CenteredShell>
        <Card>
          <div className="text-sm font-semibold text-muted-foreground">{session.project.name}</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Consent</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {session.project.consentText}
          </p>
          {error ? <ErrorCallout>{error}</ErrorCallout> : null}
          <button
            className="mt-6 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
            onClick={() => void acceptConsent()}
          >
            I agree and want to continue
          </button>
          <div className="mt-3 text-xs text-muted-foreground">
            You can close this tab at any time.
          </div>
        </Card>
      </CenteredShell>
    );
  }

  if (stage === "INTRO") {
    return (
      <CenteredShell>
        <Card>
          <div className="text-sm font-semibold text-muted-foreground">{session.project.name}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Let&apos;s begin
          </h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {session.project.introScript}
          </p>
          {error ? <ErrorCallout>{error}</ErrorCallout> : null}
          <button
            className="mt-6 w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
            onClick={startInterview}
          >
            Start interview
          </button>
        </Card>
      </CenteredShell>
    );
  }

  if (stage === "COMPLETE") {
    return (
      <CenteredShell>
        <Card>
          <div className="text-sm font-semibold text-muted-foreground">{session.project.name}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Complete</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {session.project.closingScript}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            Go to dashboard
          </Link>
        </Card>
      </CenteredShell>
    );
  }

  // ASKING / RECORDING / SAVING share the same UI
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground">{session.project.name}</div>
            <div className="mt-1 text-xl font-semibold tracking-tight">
              Interview
              {activeQuestionText ? (
                <span className="ml-2 text-sm font-medium text-muted-foreground">(follow-up)</span>
              ) : null}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.min(qIndex + 1, questions.length)} / {questions.length}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-muted-foreground">Progress</div>
            <div className="text-sm font-medium text-foreground">{progress}%</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-7">
            <div className="text-xs font-semibold text-muted-foreground">Question</div>
            <div className="mt-2 whitespace-pre-wrap text-2xl font-semibold leading-9 tracking-tight text-foreground">
              {displayedQuestionText}
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Answer in your own words.</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/70 p-7 shadow-sm backdrop-blur">
          <VoiceInput
            value={answer}
            hideLiveText
            disabled={stage === "SAVING"}
            onRecordingChange={(rec) => setStage(rec ? "RECORDING" : "ASKING")}
            onFinalTranscript={(finalText) => {
              setAnswer(finalText);
            }}
            variant="hirevue"
          />

          {error ? <ErrorCallout>{error}</ErrorCallout> : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Status:{" "}
              {stage === "ASKING"
                ? "Ready"
                : stage === "RECORDING"
                  ? "Listening…"
                  : stage === "SAVING"
                    ? "Saving…"
                    : stage}
            </div>
            <button
              onClick={() => void saveResponse({ transcript: answer })}
              disabled={stage !== "ASKING" || !answer.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
            >
              Submit answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CenteredShell(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-xl">{props.children}</div>
    </div>
  );
}

function Card(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
      {props.children}
    </div>
  );
}

function ErrorCallout(props: { children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {props.children}
    </div>
  );
}
