export type SentimentLabel = "Positive" | "Negative";

export type SentimentSource = "keywords" | "local-model";

export type SentimentPrediction = {
  label: SentimentLabel;
  /** 0 to 1. The UI shows this as a percentage. */
  confidence: number;
  source: SentimentSource;
};

export type Analysis = {
  sentiment: SentimentPrediction;
  explanation: string | null;
  reply: string | null;
  /** Present when the sentiment step worked but Gemini did not. */
  warning?: string;
};
