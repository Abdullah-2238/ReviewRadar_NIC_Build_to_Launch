import { loadLocalModel, scoreWithModel } from "@/lib/model";
import type { SentimentLabel, SentimentPrediction } from "@/lib/types";

const POSITIVE_WORDS = [
  "love",
  "loved",
  "great",
  "excellent",
  "amazing",
  "awesome",
  "good",
  "happy",
  "perfect",
  "recommend",
  "wonderful",
  "best",
  "fantastic",
  "pleased",
  "helpful",
];

const NEGATIVE_WORDS = [
  "bad",
  "terrible",
  "awful",
  "hate",
  "hated",
  "worst",
  "poor",
  "broken",
  "disappointed",
  "disappointing",
  "refund",
  "horrible",
  "useless",
  "slow",
  "waste",
];

/**
 * Step 1 (today): keyword rules, with a random label when no keywords match.
 * Step 2 (later): if public/model.json has ready: true, score with that file.
 */
export async function predictSentiment(review: string): Promise<SentimentPrediction> {
  const model = await loadLocalModel();

  if (model) {
    const score = scoreWithModel(review, model);
    const positiveProbability = sigmoid(score);
    const label: SentimentLabel = positiveProbability >= 0.5 ? "Positive" : "Negative";
    const confidence =
      label === "Positive" ? positiveProbability : 1 - positiveProbability;

    return {
      label,
      confidence: clamp(confidence, 0.5, 0.99),
      source: "local-model",
    };
  }

  return predictWithKeywords(review);
}

function predictWithKeywords(review: string): SentimentPrediction {
  const tokens = new Set(review.toLowerCase().match(/[a-z']+/g) ?? []);
  const positiveHits = POSITIVE_WORDS.filter((word) => tokens.has(word)).length;
  const negativeHits = NEGATIVE_WORDS.filter((word) => tokens.has(word)).length;

  if (positiveHits === 0 && negativeHits === 0) {
    return {
      label: Math.random() < 0.5 ? "Positive" : "Negative",
      confidence: round(0.51 + Math.random() * 0.09),
      source: "keywords",
    };
  }

  if (positiveHits === negativeHits) {
    return {
      label: Math.random() < 0.5 ? "Positive" : "Negative",
      confidence: 0.55,
      source: "keywords",
    };
  }

  const label: SentimentLabel = positiveHits > negativeHits ? "Positive" : "Negative";
  const total = positiveHits + negativeHits;
  const margin = Math.abs(positiveHits - negativeHits) / total;

  return {
    label,
    confidence: round(Math.min(0.95, 0.62 + margin * 0.3)),
    source: "keywords",
  };
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function clamp(value: number, min: number, max: number): number {
  return round(Math.min(max, Math.max(min, value)));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
