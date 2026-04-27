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
  { params }: { params: Promise<{ id: string; format: string }> },
) {
  const { id, format } = await params;
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

  if (!project) return new Response("Not found", { status: 404 });

  const responses = await db
    .select()
    .from(schema.interviewResponses)
    .where(eq(schema.interviewResponses.sessionId, session.id))
    .orderBy(asc(schema.interviewResponses.createdAt));

  if (format === "json") {
    const payload = {
      session: {
        id: session.id,
        projectId: session.projectId,
        publicToken: session.publicToken,
        consented: session.consented,
        consentedAt: session.consentedAt,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        introScript: project.introScript,
        consentText: project.consentText,
        closingScript: project.closingScript,
        maxFollowUps: project.maxFollowUps,
        createdAt: project.createdAt,
      },
      responses: responses.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        questionText: r.questionText,
        transcript: r.transcript,
        followUpCount: r.followUpCount,
        createdAt: r.createdAt,
      })),
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="session-${session.id}.json"`,
      },
    });
  }

  if (format === "csv") {
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
    const body = header.join(",") + "\n" + rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="session-${session.id}.csv"`,
      },
    });
  }

  // Default: txt
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
