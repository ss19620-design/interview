import Link from "next/link";
import { getDb } from "@/lib/prisma";
import { AppShell } from "@/app/_components/AppShell";
import { ProjectEditor } from "./projectEditor";
import { CreateSessionButton } from "./createSessionButton";

export default async function ProjectPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { id } = await props.params;
  const { session: sessionId } = await props.searchParams;

  const db = await getDb();
  const project = await db.researchProject.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      sessions: { orderBy: { startedAt: "desc" } },
    },
  });

  if (!project) {
    return (
      <AppShell title="Project">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-lg font-semibold">Project not found</div>
          <Link className="mt-3 inline-block underline" href="/projects">
            Back to projects
          </Link>
        </div>
      </AppShell>
    );
  }

  const selectedSession = sessionId
    ? await db.interviewSession.findUnique({
        where: { id: sessionId },
        include: { responses: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  return (
    <AppShell title={project.name}>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProjectEditor
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              consentText: project.consentText,
              introScript: project.introScript,
              closingScript: project.closingScript,
              maxFollowUps: project.maxFollowUps,
              questions: project.questions,
            }}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-tight">Sessions</div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  Generate a public link and share it with interviewees.
                </div>
              </div>
            </div>

            <CreateSessionButton projectId={project.id} />

            <div className="mt-5 space-y-3">
              {project.sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/projects/${project.id}?session=${s.id}`}
                  className="block rounded-xl border border-border bg-card px-4 py-4 text-sm shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-foreground">
                      {s.consented ? "Consented" : "Not consented"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.startedAt ? s.startedAt.toLocaleString() : "—"}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">ID: {s.id}</div>
                </Link>
              ))}

              {project.sessions.length === 0 ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-6 text-sm text-muted-foreground shadow-sm">
                  No sessions yet. Generate a link to start collecting interviews.
                </div>
              ) : null}
            </div>
          </section>

          {selectedSession ? (
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold tracking-tight">Session transcripts</div>
                  <div className="mt-1 text-xs text-muted-foreground">Session ID: {selectedSession.id}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <a
                    className="text-sm font-medium text-foreground underline underline-offset-4"
                    href={`/api/export/session/${selectedSession.id}.txt`}
                  >
                    Download TXT
                  </a>
                  <a
                    className="text-sm font-medium text-foreground underline underline-offset-4"
                    href={`/api/export/session/${selectedSession.id}.csv`}
                  >
                    Download CSV
                  </a>
                  <a
                    className="text-sm font-medium text-foreground underline underline-offset-4"
                    href={`/api/export/session/${selectedSession.id}.json`}
                  >
                    Download JSON
                  </a>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {selectedSession.responses.map((r, idx) => (
                  <div key={r.id} className="rounded-xl border border-border p-5 shadow-sm">
                    <div className="text-xs font-semibold text-muted-foreground">Q{idx + 1}</div>
                    <div className="mt-1 text-sm font-medium text-foreground">{r.questionText}</div>
                    <div className="mt-4 text-xs font-medium text-muted-foreground">Answer</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                      {r.transcript}
                    </div>
                  </div>
                ))}

                {selectedSession.responses.length === 0 ? (
                  <div className="rounded-xl border border-border bg-secondary/40 p-6 text-sm text-muted-foreground shadow-sm">
                    No responses yet.
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
