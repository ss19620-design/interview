import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function GET() {
  const db = await getDb();
  const projects = await db.researchProject.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { questions: true, sessions: true } },
    },
  });
  return NextResponse.json({ projects });
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

  const description = (body.description ?? "").trim();
  const consentText = (body.consentText ?? "").trim();
  const introScript = (body.introScript ?? "").trim();
  const closingScript = (body.closingScript ?? "").trim();
  const maxFollowUps =
    typeof body.maxFollowUps === "number" && body.maxFollowUps >= 0 ? body.maxFollowUps : 1;

  const questions = Array.isArray(body.questions) ? body.questions : [];

  const db = await getDb();
  const project = await db.researchProject.create({
    data: {
      name,
      description,
      consentText,
      introScript,
      closingScript,
      maxFollowUps,
      questions: {
        create: questions
          .map((q) => (q?.text ?? "").trim())
          .filter(Boolean)
          .map((text, idx) => ({ text, orderIndex: idx })),
      },
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
