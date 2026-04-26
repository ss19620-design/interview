import { getDb } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<Record<string, string>> },
) {
  const p = await context.params;
  const id = p["id.txt"] ?? p["id"] ?? "";
  if (!id) return new Response("Not found", { status: 404 });

  const db = await getDb();
  const session = await db.interviewSession.findUnique({
    where: { id },
    include: {
      project: true,
      responses: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) return new Response("Not found", { status: 404 });

  const lines: string[] = [];
  lines.push(`Interview Session: ${session.id}`);
  lines.push(`Project: ${session.project.name}`);
  lines.push("");

  session.responses.forEach((r, idx) => {
    lines.push(`Question ${idx + 1}:`);
    lines.push(r.questionText);
    lines.push("");
    lines.push("Answer:");
    lines.push(r.transcript || "");
    lines.push("");
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="session-${session.id}.txt"`,
    },
  });
}
