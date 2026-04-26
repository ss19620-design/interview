import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = await getDb();
  const now = new Date().toISOString();
  const [session] = await db.update(schema.interviewSessions)
    .set({ consented: true, consentedAt: now, startedAt: now })
    .where(eq(schema.interviewSessions.publicToken, token))
    .returning();

  return NextResponse.json({ session });
}
