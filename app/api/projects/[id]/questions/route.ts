import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, asc, inArray } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const body = (await req.json()) as { questions: Array<{ id?: string; text: string }> };

  const normalized = (body.questions ?? [])
    .map((q) => ({ id: q.id, text: (q.text ?? "").trim() }))
    .filter((q) => q.text.length > 0);

  const db = await getDb();
  const existing = await db.select({ id: schema.interviewQuestions.id }).from(schema.interviewQuestions).where(eq(schema.interviewQuestions.projectId, projectId));
  const keepIds = new Set(normalized.map((q) => q.id).filter(Boolean) as string[]);
  const toDelete = existing.filter((q) => !keepIds.has(q.id)).map((q) => q.id);

  if (toDelete.length) {
    await db.delete(schema.interviewQuestions).where(inArray(schema.interviewQuestions.id, toDelete));
  }

  for (let i = 0; i < normalized.length; i++) {
    const q = normalized[i];
    if (q.id) {
      await db.update(schema.interviewQuestions).set({ text: q.text, orderIndex: i }).where(eq(schema.interviewQuestions.id, q.id));
    } else {
      await db.insert(schema.interviewQuestions).values({ projectId, text: q.text, orderIndex: i });
    }
  }

  const [project] = await db.select().from(schema.researchProjects).where(eq(schema.researchProjects.id, projectId));
  const questions = await db.select().from(schema.interviewQuestions).where(eq(schema.interviewQuestions.projectId, projectId)).orderBy(asc(schema.interviewQuestions.orderIndex));

  return NextResponse.json({ project: { ...project, questions } });
}
