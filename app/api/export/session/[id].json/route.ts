import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const p = await context.params;
  const id = p["id.json"] ?? p["id"] ?? "";
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
