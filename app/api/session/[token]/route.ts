import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = await getDb();

  const [session] = await db.select().from(schema.interviewSessions).where(eq(schema.interviewSessions.publicToken, token));
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [project] = await db.select().from(schema.researchProjects).where(eq(schema.researchProjects.id, session.projectId));
  const questions = await db.select().from(schema.interviewQuestions).where(eq(schema.interviewQuestions.projectId, session.projectId)).orderBy(asc(schema.interviewQuestions.orderIndex));
  const responses = await db.select().from(schema.interviewResponses).where(eq(schema.interviewResponses.sessionId, session.id)).orderBy(asc(schema.interviewResponses.createdAt));

  return NextResponse.json({
    session: {
      ...session,
      project: { ...project, questions },
      responses,
    },
  });
}
