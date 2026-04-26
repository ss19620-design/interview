import { GoogleGenerativeAI } from "@google/generative-ai";

function normalizeOneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export async function generateNeutralFollowUp(args: {
  questionText: string;
  transcript: string;
}): Promise<string> {
  const { questionText, transcript } = args;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Could you share a bit more detail?";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const system =
      "You are an interview assistant. " +
      "Ask exactly one follow-up question. " +
      "Be neutral, concise, and avoid leading language. " +
      "Do not introduce new topics beyond the original question.";

    const user =
      `Original question: ${questionText}\n` +
      `Interviewee answer (too short): ${transcript}\n\n` +
      "Write a single neutral follow-up question to encourage more detail.";

    const result = await model.generateContent([{ text: system }, { text: user }]);
    const text = normalizeOneLine(result.response.text() ?? "");
    const cleaned = text.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    if (!cleaned) return "Could you share a bit more detail?";

    // Ensure it's a question.
    if (!cleaned.endsWith("?")) return `${cleaned}?`;
    return cleaned;
  } catch {
    return "Could you share a bit more detail?";
  }
}

