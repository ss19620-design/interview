"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = { id: string; orderIndex: number; text: string };

export function ProjectEditor(props: {
  project: {
    id: string;
    name: string;
    description: string;
    consentText: string;
    introScript: string;
    closingScript: string;
    maxFollowUps: number;
    questions: Question[];
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(props.project.name);
  const [description, setDescription] = useState(props.project.description);
  const [consentText, setConsentText] = useState(props.project.consentText);
  const [introScript, setIntroScript] = useState(props.project.introScript);
  const [closingScript, setClosingScript] = useState(props.project.closingScript);
  const [maxFollowUps, setMaxFollowUps] = useState(props.project.maxFollowUps);
  const [questionsText, setQuestionsText] = useState(
    props.project.questions
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => q.text)
      .join("\n"),
  );

  const parsed = useMemo(() => {
    const existingByText = new Map(
      props.project.questions.map((q) => [q.text.trim(), q.id] as const),
    );
    return questionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({
        id: existingByText.get(text),
        text,
      }));
  }, [questionsText, props.project.questions]);

  async function saveAll() {
    setSaving(true);
    setError(null);
    try {
      const r1 = await fetch(`/api/projects/${props.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          consentText,
          introScript,
          closingScript,
          maxFollowUps,
        }),
      });
      if (!r1.ok) {
        const j = (await r1.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Failed to save project");
      }

      const r2 = await fetch(`/api/projects/${props.project.id}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsed }),
      });
      if (!r2.ok) {
        const j = (await r2.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Failed to save questions");
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!confirm("Delete this project and all sessions?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${props.project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      router.push("/projects");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete project");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Project configuration</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Edit scripts and questions. Sessions use the latest saved version.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void deleteProject()}
            disabled={saving}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-destructive shadow-sm hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive/20 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={() => void saveAll()}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold tracking-tight text-foreground">Basic info</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">The project title and description.</div>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Name</div>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Description</div>
              <textarea className={`min-h-28 ${inputCls}`} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold tracking-tight text-foreground">Consent</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">Shown before the interview begins.</div>
          <div className="mt-4">
            <label className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Consent text</div>
              <textarea className={`min-h-32 ${inputCls}`} value={consentText} onChange={(e) => setConsentText(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold tracking-tight text-foreground">Scripts</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">Guidance at the start and end.</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Intro script</div>
              <textarea className={`min-h-32 ${inputCls}`} value={introScript} onChange={(e) => setIntroScript(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Closing script</div>
              <textarea className={`min-h-32 ${inputCls}`} value={closingScript} onChange={(e) => setClosingScript(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold tracking-tight text-foreground">Settings</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            Follow-ups are used when an answer is very short.
          </div>
          <div className="mt-4">
            <label className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Max follow-ups</div>
              <input
                className={`w-40 ${inputCls}`}
                type="number"
                min={0}
                value={maxFollowUps}
                onChange={(e) => setMaxFollowUps(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-sm font-semibold tracking-tight text-foreground">Questions</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">One per line. Asked in order.</div>
          <div className="mt-4">
            <label className="grid gap-2">
              <div className="text-sm font-medium text-foreground">Questions (one per line)</div>
              <textarea className={`min-h-72 ${inputCls}`} value={questionsText} onChange={(e) => setQuestionsText(e.target.value)} />
              <div className="text-xs text-muted-foreground">{parsed.length} questions</div>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
