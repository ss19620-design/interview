import Link from "next/link";
import { getDb, schema } from "@/lib/db";
import { desc, eq, count } from "drizzle-orm";
import { AppShell } from "@/app/_components/AppShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await getDb();

  const allProjects = await db
    .select()
    .from(schema.researchProjects)
    .orderBy(desc(schema.researchProjects.createdAt));

  const projects = await Promise.all(
    allProjects.map(async (p) => {
      const [qCount] = await db
        .select({ value: count() })
        .from(schema.interviewQuestions)
        .where(eq(schema.interviewQuestions.projectId, p.id));

      const [sCount] = await db
        .select({ value: count() })
        .from(schema.interviewSessions)
        .where(eq(schema.interviewSessions.projectId, p.id));

      const sessions = await db
        .select()
        .from(schema.interviewSessions)
        .where(eq(schema.interviewSessions.projectId, p.id))
        .orderBy(desc(schema.interviewSessions.startedAt));

      return {
        ...p,
        _count: { questions: qCount.value, sessions: sCount.value },
        sessions,
      };
    }),
  );

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create projects, generate interview links, and export transcripts.
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            New project
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-lg font-semibold tracking-tight text-card-foreground">{p.name}</div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
                    {p.description || "—"}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-secondary px-3 py-1">
                      {p._count.questions} questions
                    </span>
                    <span className="rounded-md bg-secondary px-3 py-1">
                      {p._count.sessions} sessions
                    </span>
                    <span className="rounded-md bg-secondary px-3 py-1">
                      Last activity:{" "}
                      {p.sessions[0]?.startedAt ? new Date(p.sessions[0].startedAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="shrink-0 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  Open
                </Link>
              </div>

              {p.sessions.length > 0 ? (
                <div className="mt-6 border-t border-border pt-5">
                  <div className="text-xs font-medium text-muted-foreground">Recent sessions</div>
                  <div className="mt-3 space-y-2">
                    {p.sessions.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          {s.startedAt ? new Date(s.startedAt).toLocaleString() : "Not started"}
                        </div>
                        <Link
                          href={`/projects/${p.id}?session=${s.id}`}
                          className="text-sm text-foreground underline underline-offset-4"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {projects.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm md:col-span-2">
              <div className="mx-auto max-w-md">
                <div className="text-lg font-semibold tracking-tight">Create your first project</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Add questions, generate a link, and collect voice responses with transcripts.
                </p>
                <Link
                  href="/projects"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  Create project
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
