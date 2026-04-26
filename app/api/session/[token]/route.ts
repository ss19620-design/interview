import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = await getDb();
  const session = await db.interviewSession.findUnique({
    where: { publicToken: token },
    include: {
      project: {
        include: { questions: { orderBy: { orderIndex: "asc" } } },
      },
      responses: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    session: {
      id: session.id,
      publicToken: session.publicToken,
      consented: session.consented,
      consentedAt: session.consentedAt,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      project: {
        id: session.project.id,
        name: session.project.name,
        description: session.project.description,
        consentText: session.project.consentText,
        introScript: session.project.introScript,
        closingScript: session.project.closingScript,
        maxFollowUps: session.project.maxFollowUps,
        questions: session.project.questions.map((q) => ({
          id: q.id,
          orderIndex: q.orderIndex,
          text: q.text,
        })),
      },
      responses: session.responses.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        questionText: r.questionText,
        transcript: r.transcript,
        followUpCount: r.followUpCount,
        createdAt: r.createdAt,
      })),
    },
  });
}
