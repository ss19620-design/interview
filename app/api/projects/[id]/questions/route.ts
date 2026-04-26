import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const body = (await req.json()) as {
    questions: Array<{ id?: string; text: string }>;
  };

  const questions = Array.isArray(body?.questions) ? body.questions : [];
  const normalized = questions
    .map((q) => ({ id: q.id, text: (q.text ?? "").trim() }))
    .filter((q) => q.text.length > 0);

  const db = await getDb();

  const existing = await db.interviewQuestion.findMany({
    where: { projectId },
    select: { id: true },
  });
  const keepIds = new Set(normalized.map((q) => q.id).filter(Boolean) as string[]);
  const toDelete = existing.filter((q) => !keepIds.has(q.id)).map((q) => q.id);

  await db.$transaction(async (tx) => {
    if (toDelete.length) {
      await tx.interviewQuestion.deleteMany({
        where: { id: { in: toDelete }, projectId },
      });
    }

    for (let i = 0; i < normalized.length; i++) {
      const q = normalized[i];
      if (q.id) {
        await tx.interviewQuestion.update({
          where: { id: q.id },
          data: { text: q.text, orderIndex: i },
        });
      } else {
        await tx.interviewQuestion.create({
          data: { projectId, text: q.text, orderIndex: i },
        });
      }
    }
  });

  const project = await db.researchProject.findUnique({
    where: { id: projectId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  return NextResponse.json({ project });
}
