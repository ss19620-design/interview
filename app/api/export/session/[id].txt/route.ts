import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const p = await context.params;
  const id = p["id.txt"] ?? p["id"] ?? "";
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

  const lines: string[] = [];
  lines.push(`Interview Session: ${session.id}`);
  lines.push(`Project: ${project.name}`);
  lines.push("");

  responses.forEach((r, idx) => {
    lines.push(`Question ${idx + 1}:`);
    lines.push(r.questionText);
    lines.push("");
    lines.push("Answer:");
    lines.push(r.transcript || "");
    lines.push("");
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="session-${session.id}.txt"`,
    },
  });
}
