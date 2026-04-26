import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<{ projectId: string }>;
  const projectId = (body.projectId ?? "").trim();
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  // Use Web Crypto API (works in both Node and Workers)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  const db = await getDb();
  const session = await db.interviewSession.create({
    data: { projectId, publicToken: token },
  });

  return NextResponse.json({ session }, { status: 201 });
}
