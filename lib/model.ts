import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Shape of /public/model.json.
 *
 * Leave `ready` as false until you drop in real weights. The app then
 * keeps using the keyword placeholder in lib/sentiment.ts.
 *
 * When you are ready, a minimal file looks like this:
 * {
 *   "ready": true,
 *   "version": "1",
 *   "labels": ["Negative", "Positive"],
 *   "vocabulary": { "love": 0, "broken": 1 },
 *   "weights": [1.4, -1.6],
 *   "bias": 0
 * }
 *
 * `vocabulary` maps a word to an index in `weights`.
 * A higher score means Positive. A lower score means Negative.
 */
export type LocalSentimentModel = {
  ready: boolean;
  version: string;
  labels: ["Negative", "Positive"];
  vocabulary: Record<string, number>;
  weights: number[];
  bias: number;
};

export async function loadLocalModel(): Promise<LocalSentimentModel | null> {
  const filePath = path.join(process.cwd(), "public", "model.json");

  try {
    const raw = await readFile(filePath, "utf8");
    const data: unknown = JSON.parse(raw);
    if (!isUsableModel(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function scoreWithModel(review: string, model: LocalSentimentModel): number {
  const tokens = review.toLowerCase().match(/[a-z']+/g) ?? [];
  const seen = new Set<string>();
  let score = model.bias;

  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);

    const index = model.vocabulary[token];
    if (index === undefined) continue;

    const weight = model.weights[index];
    if (typeof weight === "number") score += weight;
  }

  return score;
}

function isUsableModel(data: unknown): data is LocalSentimentModel {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  const model = data as Partial<LocalSentimentModel>;
  return (
    model.ready === true &&
    typeof model.version === "string" &&
    Array.isArray(model.labels) &&
    model.labels[0] === "Negative" &&
    model.labels[1] === "Positive" &&
    model.labels.length === 2 &&
    typeof model.bias === "number" &&
    Number.isFinite(model.bias) &&
    Array.isArray(model.weights) &&
    model.weights.length > 0 &&
    model.weights.every((weight) => typeof weight === "number" && Number.isFinite(weight)) &&
    !!model.vocabulary &&
    typeof model.vocabulary === "object" &&
    !Array.isArray(model.vocabulary) &&
    Object.values(model.vocabulary).every(
      (index) => Number.isInteger(index) && index >= 0 && index < model.weights!.length,
    )
  );
}
