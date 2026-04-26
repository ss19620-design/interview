import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { generateNeutralFollowUp } from "@/lib/ai/followup";

function wordCount(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = (await req.json()) as Partial<{
    questionId: string | null;
    questionText: string;
    transcript: string;
    followUpCount: number;
    isLastQuestion: boolean;
    questionIndex: number;
    totalQuestions: number;
  }>;

  const questionText = (body.questionText ?? "").trim();
  const transcript = (body.transcript ?? "").trim();
  const followUpCount = typeof body.followUpCount === "number" ? body.followUpCount : 0;

  if (!questionText) return NextResponse.json({ error: "questionText is required" }, { status: 400 });

  const db = await getDb();
  const [session] = await db.select().from(schema.interviewSessions).where(eq(schema.interviewSessions.publicToken, token));
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [project] = await db.select({ maxFollowUps: schema.researchProjects.maxFollowUps }).from(schema.researchProjects).where(eq(schema.researchProjects.id, session.projectId));

  if (!session.startedAt) {
    await db.update(schema.interviewSessions).set({ startedAt: new Date().toISOString() }).where(eq(schema.interviewSessions.id, session.id));
  }

  await db.insert(schema.interviewResponses).values({
    sessionId: session.id,
    questionId: body.questionId ?? null,
    questionText,
    transcript,
    followUpCount,
  });

  // Server-side last-question detection
  const allQuestions = await db.select({ id: schema.interviewQuestions.id }).from(schema.interviewQuestions).where(eq(schema.interviewQuestions.projectId, session.projectId)).orderBy(asc(schema.interviewQuestions.orderIndex));
  const allIds = allQuestions.map((q) => q.id);
  const serverIsLast = body.questionId ? allIds.indexOf(body.questionId) >= allIds.length - 1 : false;

  const isLast =
    body.isLastQuestion === true ||
    serverIsLast ||
    (typeof body.questionIndex === "number" && typeof body.totalQuestions === "number" && body.questionIndex >= body.totalQuestions - 1);

  const tooShort = wordCount(transcript) < 10;
  const max = project?.maxFollowUps ?? 1;

  if (tooShort && followUpCount < max) {
    const followUpQuestionText = await generateNeutralFollowUp({ questionText, transcript });
    return NextResponse.json({ action: "followup", followUpQuestionText, nextFollowUpCount: followUpCount + 1 });
  }

  if (isLast) {
    await db.update(schema.interviewSessions).set({ completedAt: new Date().toISOString() }).where(eq(schema.interviewSessions.id, session.id));
    return NextResponse.json({ action: "complete" });
  }

  return NextResponse.json({ action: "next" });
}
