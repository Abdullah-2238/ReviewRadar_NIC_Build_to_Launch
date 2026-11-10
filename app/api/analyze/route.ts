import { writeExplanation } from "@/lib/gemini";
import { predictSentiment } from "@/lib/sentiment";
import type { Analysis } from "@/lib/types";

const MIN_LENGTH = 8;
const MAX_LENGTH = 4000;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON body with a review field." }, { status: 400 });
  }

  const review =
    body && typeof body === "object" && "review" in body ? body.review : undefined;

  if (typeof review !== "string") {
    return Response.json({ error: "The review field must be a string." }, { status: 400 });
  }

  const text = review.trim();

  if (text.length < MIN_LENGTH) {
    return Response.json(
      { error: "Paste a review with at least a few words." },
      { status: 400 },
    );
  }

  if (text.length > MAX_LENGTH) {
    return Response.json(
      { error: `Keep the review under ${MAX_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const sentiment = await predictSentiment(text);

  try {
    const copy = await writeExplanation(text, sentiment);
    const analysis: Analysis = {
      sentiment,
      explanation: copy.explanation,
      reply: copy.reply,
    };
    return Response.json(analysis);
  } catch (error) {
    console.error("Gemini failed to generate review insights.", error);
    const analysis: Analysis = {
      sentiment,
      explanation: null,
      reply: null,
      warning: process.env.GEMINI_API_KEY
        ? "Sentiment was analyzed, but Gemini could not generate an explanation or reply. Please try again."
        : "Sentiment was analyzed. Add GEMINI_API_KEY to .env.local to enable the explanation and suggested reply.",
    };
    return Response.json(analysis);
  }
}
