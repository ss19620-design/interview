import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, asc, desc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  const [project] = await db.select().from(schema.researchProjects).where(eq(schema.researchProjects.id, id));
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = await db.select().from(schema.interviewQuestions).where(eq(schema.interviewQuestions.projectId, id)).orderBy(asc(schema.interviewQuestions.orderIndex));
  const sessions = await db.select().from(schema.interviewSessions).where(eq(schema.interviewSessions.projectId, id)).orderBy(desc(schema.interviewSessions.startedAt));

  return NextResponse.json({ project: { ...project, questions, sessions } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<{
    name: string; description: string; consentText: string;
    introScript: string; closingScript: string; maxFollowUps: number;
  }>;

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.consentText === "string") data.consentText = body.consentText;
  if (typeof body.introScript === "string") data.introScript = body.introScript;
  if (typeof body.closingScript === "string") data.closingScript = body.closingScript;
  if (typeof body.maxFollowUps === "number" && body.maxFollowUps >= 0) data.maxFollowUps = body.maxFollowUps;

  const db = await getDb();
  const [project] = await db.update(schema.researchProjects).set(data).where(eq(schema.researchProjects.id, id)).returning();
  return NextResponse.json({ project });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  await db.delete(schema.researchProjects).where(eq(schema.researchProjects.id, id));
  return NextResponse.json({ ok: true });
}
