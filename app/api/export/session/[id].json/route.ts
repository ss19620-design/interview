import { getDb } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const p = await context.params;
  const id = p["id.json"] ?? p["id"] ?? "";
  if (!id) return new Response("Not found", { status: 404 });

  const db = await getDb();
  const session = await db.interviewSession.findUnique({
    where: { id },
    include: {
      project: true,
      responses: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) return new Response("Not found", { status: 404 });

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
      id: session.project.id,
      name: session.project.name,
      description: session.project.description,
      introScript: session.project.introScript,
      consentText: session.project.consentText,
      closingScript: session.project.closingScript,
      maxFollowUps: session.project.maxFollowUps,
      createdAt: session.project.createdAt,
    },
    responses: session.responses.map((r) => ({
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
