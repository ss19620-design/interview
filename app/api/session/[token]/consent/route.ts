import { NextResponse } from "next/server";
import { getDb } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = await getDb();
  const session = await db.interviewSession.update({
    where: { publicToken: token },
    data: {
      consented: true,
      consentedAt: new Date(),
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ session });
}
