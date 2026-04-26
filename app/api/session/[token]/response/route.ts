import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";
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

  if (!questionText) {
    return NextResponse.json({ error: "questionText is required" }, { status: 400 });
  }

  const db = await getDb();
  const session = await db.interviewSession.findUnique({
    where: { publicToken: token },
    include: {
      project: {
        select: {
          maxFollowUps: true,
          questions: { select: { id: true }, orderBy: { orderIndex: "asc" } },
        },
      },
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.interviewSession.update({
    where: { id: session.id },
    data: { startedAt: session.startedAt ?? new Date() },
  });

  await db.interviewResponse.create({
    data: {
      sessionId: session.id,
      questionId: body.questionId ?? null,
      questionText,
      transcript,
      followUpCount,
    },
  });

  const allQuestionIds = session.project.questions.map((q) => q.id);
  const serverIsLast = body.questionId
    ? allQuestionIds.indexOf(body.questionId) >= allQuestionIds.length - 1
    : false;

  const isLast =
    body.isLastQuestion === true ||
    serverIsLast ||
    (typeof body.questionIndex === "number" &&
      typeof body.totalQuestions === "number" &&
      body.questionIndex >= body.totalQuestions - 1);

  const tooShort = wordCount(transcript) < 10;
  const max = session.project.maxFollowUps ?? 1;

  if (tooShort && followUpCount < max) {
    const followUpQuestionText = await generateNeutralFollowUp({
      questionText,
      transcript,
    });
    return NextResponse.json({
      action: "followup" as const,
      followUpQuestionText,
      nextFollowUpCount: followUpCount + 1,
    });
  }

  if (isLast) {
    await db.interviewSession.update({
      where: { id: session.id },
      data: { completedAt: new Date() },
    });
    return NextResponse.json({ action: "complete" as const });
  }

  return NextResponse.json({ action: "next" as const });
}
