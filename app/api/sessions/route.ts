import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<{ projectId: string }>;
  const projectId = (body.projectId ?? "").trim();
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  const db = await getDb();
  const [session] = await db.insert(schema.interviewSessions).values({ projectId, publicToken: token }).returning();

  return NextResponse.json({ session }, { status: 201 });
}
