import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
              <Image src="/logo.png" alt="InterviewBot" fill className="object-contain p-2.5" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">InterviewBot</div>
              <div className="text-xs text-muted-foreground">Voice-first research interviews</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              Create project
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              Open dashboard
            </Link>
          </div>
        </header>

        <main className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <section>
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              Local-first · Voice-first · Export-ready
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight leading-tight">
              Welcome to calmer, more human research interviews.
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              InterviewBot helps you collect consistent, high-quality answers—without scheduling calls.
              Create a question set, share a link, and let participants respond in their own voice.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                Create a project
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                View dashboard
              </Link>
            </div>

            <div className="mt-10 grid gap-4">
              <Feature title="Guided, one-question-at-a-time flow" desc="Less cognitive load. More thoughtful responses." />
              <Feature title="Voice-first experience" desc="Participants speak naturally. You get clean transcripts." />
              <Feature title="Local-first storage" desc="Everything stays in SQLite on your machine." />
              <Feature title="Export anytime" desc="Download TXT, CSV, or JSON for analysis." />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="text-sm font-semibold text-foreground">A guided experience</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Participants see one question at a time, a simple mic control, and a single submit button.
              No clutter. No distractions. Just thoughtful answers.
            </p>

            <div className="mt-7 grid gap-4">
              <Callout
                title="Built for real research"
                desc="Consent first, clear scripts, and a consistent structure across sessions."
              />
              <Callout
                title="Premium, calm UI"
                desc="Large readable text, breathing room, and a centered interview surface."
              />
              <Callout
                title="Works locally"
                desc="No cloud storage. No paid services. Your data stays on your machine."
              />
            </div>

            <div className="mt-8 rounded-lg bg-primary/5 p-5 ring-1 ring-primary/20">
              <div className="text-xs font-semibold text-primary">Workflow</div>
              <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>1) Create a project + questions</li>
                <li>2) Generate a session link</li>
                <li>3) Participants respond via voice</li>
                <li>4) Export transcripts for analysis</li>
              </ol>
            </div>
          </section>
        </main>

        <footer className="mt-14 border-t border-border py-8 text-xs text-muted-foreground">
          Built for local-first MVP research workflows. No external storage.
        </footer>
      </div>
    </div>
  );
}

function Feature(props: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">{props.title}</div>
      <div className="mt-1 text-sm leading-6 text-muted-foreground">{props.desc}</div>
    </div>
  );
}

function Callout(props: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">{props.title}</div>
      <div className="mt-1 text-sm leading-6 text-muted-foreground">{props.desc}</div>
    </div>
  );
}
