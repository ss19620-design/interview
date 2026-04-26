import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function csvEscape(v: string): string {
  const s = v ?? "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  _req: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const p = await context.params;
  const id = p["id.csv"] ?? p["id"] ?? "";
  if (!id) return new Response("Not found", { status: 404 });

  const db = await getDb();

  const [session] = await db
    .select()
    .from(schema.interviewSessions)
    .where(eq(schema.interviewSessions.id, id))
    .limit(1);

  if (!session) return new Response("Not found", { status: 404 });

  const [project] = await db
    .select()
    .from(schema.researchProjects)
    .where(eq(schema.researchProjects.id, session.projectId))
    .limit(1);

  const responses = await db
    .select()
    .from(schema.interviewResponses)
    .where(eq(schema.interviewResponses.sessionId, session.id))
    .orderBy(asc(schema.interviewResponses.createdAt));

  const header = ["sessionId", "projectName", "index", "questionText", "transcript", "followUpCount", "createdAt"];
  const rows = responses.map((r, idx) => [
    session.id,
    project.name,
    String(idx + 1),
    r.questionText,
    r.transcript ?? "",
    String(r.followUpCount ?? 0),
    r.createdAt,
  ]);

  const body =
    header.join(",") +
    "\n" +
    rows.map((row) => row.map(csvEscape).join(",")).join("\n") +
    "\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="session-${session.id}.csv"`,
    },
  });
}
