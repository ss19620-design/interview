import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { desc, eq, sql, count } from "drizzle-orm";

export async function GET() {
  const db = await getDb();
  const projects = await db.select().from(schema.researchProjects).orderBy(desc(schema.researchProjects.createdAt));

  const result = await Promise.all(
    projects.map(async (p) => {
      const [qCount] = await db.select({ c: count() }).from(schema.interviewQuestions).where(eq(schema.interviewQuestions.projectId, p.id));
      const [sCount] = await db.select({ c: count() }).from(schema.interviewSessions).where(eq(schema.interviewSessions.projectId, p.id));
      return { ...p, _count: { questions: qCount?.c ?? 0, sessions: sCount?.c ?? 0 } };
    }),
  );

  return NextResponse.json({ projects: result });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<{
    name: string;
    description: string;
    consentText: string;
    introScript: string;
    closingScript: string;
    maxFollowUps: number;
    questions: Array<{ text: string }>;
  }>;

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const db = await getDb();
  const [project] = await db.insert(schema.researchProjects).values({
    name,
    description: (body.description ?? "").trim(),
    consentText: (body.consentText ?? "").trim(),
    introScript: (body.introScript ?? "").trim(),
    closingScript: (body.closingScript ?? "").trim(),
    maxFollowUps: typeof body.maxFollowUps === "number" && body.maxFollowUps >= 0 ? body.maxFollowUps : 1,
  }).returning();

  const questions = (body.questions ?? [])
    .map((q) => (q?.text ?? "").trim())
    .filter(Boolean);

  if (questions.length && project) {
    await db.insert(schema.interviewQuestions).values(
      questions.map((text, idx) => ({ projectId: project.id, text, orderIndex: idx })),
    );
  }

  return NextResponse.json({ project }, { status: 201 });
}
