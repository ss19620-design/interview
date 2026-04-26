import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  const project = await db.researchProject.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      sessions: { orderBy: { startedAt: "desc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<{
    name: string;
    description: string;
    consentText: string;
    introScript: string;
    closingScript: string;
    maxFollowUps: number;
  }>;

  const db = await getDb();
  const project = await db.researchProject.update({
    where: { id },
    data: {
      ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
      ...(typeof body.description === "string" ? { description: body.description.trim() } : {}),
      ...(typeof body.consentText === "string" ? { consentText: body.consentText } : {}),
      ...(typeof body.introScript === "string" ? { introScript: body.introScript } : {}),
      ...(typeof body.closingScript === "string" ? { closingScript: body.closingScript } : {}),
      ...(typeof body.maxFollowUps === "number" && body.maxFollowUps >= 0
        ? { maxFollowUps: body.maxFollowUps }
        : {}),
    },
  });

  return NextResponse.json({ project });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  await db.researchProject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
