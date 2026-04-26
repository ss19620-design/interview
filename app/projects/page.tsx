"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/app/_components/AppShell";

type ProjectListItem = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  _count: { questions: number; sessions: number };
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [consentText, setConsentText] = useState(
    "I agree to participate in this interview and understand my responses will be recorded and transcribed for research purposes.",
  );
  const [introScript, setIntroScript] = useState("Thanks for taking the time. We'll go one question at a time.");
  const [closingScript, setClosingScript] = useState("That's all—thank you for your time.");
  const [questionsText, setQuestionsText] = useState(
    "What brought you here today?\nWhat is the hardest part of your workflow?\nIf you could change one thing, what would it be?",
  );
  const [creating, setCreating] = useState(false);

  async function readJsonOrTextError<T>(res: Response): Promise<T> {
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(text || `Request failed (${res.status})`);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const json = await readJsonOrTextError<{ projects: ProjectListItem[]; error?: string }>(res);
      if (!res.ok) throw new Error(json.error || "Failed to load projects");
      setProjects(json.projects ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const parsedQuestions = useMemo(() => {
    return questionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
  }, [questionsText]);

  async function createProject() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          consentText,
          introScript,
          closingScript,
          questions: parsedQuestions,
        }),
      });
      const json = await readJsonOrTextError<{ project?: { id: string }; error?: string }>(res);
      if (!res.ok || !json.project) throw new Error(json.error || "Failed to create project");
      router.push(`/projects/${json.project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell title="Projects">
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Create project</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Set up consent, scripts, and questions. You can refine it later.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="mt-6 space-y-6">
              <Section title="Basic info" description="Name and short description shown to the researcher.">
                <Field label="Name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    placeholder="e.g., Onboarding research"
                  />
                </Field>
                <Field label="Description" hint="What are you trying to learn?">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-28 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    placeholder="e.g., Understand where new users get stuck and why."
                  />
                </Field>
              </Section>

              <Section title="Consent" description="Shown before the interview begins. Consent is required to proceed.">
                <Field label="Consent text">
                  <textarea
                    value={consentText}
                    onChange={(e) => setConsentText(e.target.value)}
                    className="min-h-32 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </Field>
              </Section>

              <Section title="Scripts" description="Short, friendly messages that guide the interview.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Intro script" hint="Shown after consent.">
                    <textarea
                      value={introScript}
                      onChange={(e) => setIntroScript(e.target.value)}
                      className="min-h-32 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </Field>
                  <Field label="Closing script" hint="Shown when the interview completes.">
                    <textarea
                      value={closingScript}
                      onChange={(e) => setClosingScript(e.target.value)}
                      className="min-h-32 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Questions" description="One question per line. The interview asks exactly one at a time.">
                <Field label="Questions">
                  <textarea
                    value={questionsText}
                    onChange={(e) => setQuestionsText(e.target.value)}
                    className="min-h-56 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">{parsedQuestions.length} questions</div>
                </Field>
              </Section>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  You can edit everything later on the project page.
                </div>
                <button
                  disabled={creating || !name.trim()}
                  onClick={() => void createProject()}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create project"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">All projects</h2>
              <button
                onClick={() => void load()}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                Refresh
              </button>
            </div>

            {loading ? <div className="mt-4 text-sm text-muted-foreground">Loading…</div> : null}

            <div className="mt-5 space-y-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="block rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold tracking-tight">{p.name}</div>
                      <div className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
                        {p.description || "—"}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md bg-secondary px-3 py-1">
                          {p._count.questions} questions
                        </span>
                        <span className="rounded-md bg-secondary px-3 py-1">
                          {p._count.sessions} sessions
                        </span>
                      </div>
                    </div>
                    <span className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                      Open
                    </span>
                  </div>
                </Link>
              ))}

              {!loading && projects.length === 0 ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-8 text-center shadow-sm">
                  <div className="text-sm font-medium text-foreground">No projects yet</div>
                  <div className="mt-1 text-sm text-muted-foreground">Create a project to get started.</div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Section(props: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold tracking-tight text-foreground">{props.title}</div>
          {props.description ? (
            <div className="mt-1 text-sm leading-6 text-muted-foreground">{props.description}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-4">{props.children}</div>
    </div>
  );
}

function Field(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <div>
        <div className="text-sm font-medium text-foreground">{props.label}</div>
        {props.hint ? <div className="mt-0.5 text-xs text-muted-foreground">{props.hint}</div> : null}
      </div>
      {props.children}
    </label>
  );
}
