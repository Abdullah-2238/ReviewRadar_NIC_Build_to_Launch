"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import type { Analysis } from "@/lib/types";

const MAX_LENGTH = 4000;

const SAMPLES = {
  positive:
    "I love this kettle. It boiled quickly, the handle stayed cool, and it looks great on the counter. I would recommend it.",
  negative:
    "Terrible purchase. The lid arrived broken, the water tastes awful, and customer support never replied. I want a refund.",
};

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object" || !("sentiment" in value)) return false;

  const result = value as Partial<Analysis>;
  return (
    !!result.sentiment &&
    (result.sentiment.label === "Positive" || result.sentiment.label === "Negative") &&
    Number.isFinite(result.sentiment.confidence) &&
    result.sentiment.confidence >= 0 &&
    result.sentiment.confidence <= 1 &&
    (result.sentiment.source === "keywords" || result.sentiment.source === "local-model") &&
    (typeof result.explanation === "string" || result.explanation === null) &&
    (typeof result.reply === "string" || result.reply === null) &&
    (result.warning === undefined || typeof result.warning === "string")
  );
}

function RadarMark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm shadow-teal-900/15">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5" opacity=".7" />
        <path d="M12 12 18.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}

function SparkleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" fill="currentColor" />
    </svg>
  );
}

export default function HomePage() {
  const [review, setReview] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function analyze() {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCopied(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again.";
        setError(message);
        return;
      }

      if (!isAnalysis(data)) {
        setError("The server returned an unexpected response. Please try again.");
        return;
      }

      setAnalysis(data);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze();
  }

  function handleReviewKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (review.trim().length >= 8 && !loading) void analyze();
    }
  }

  async function copyReply() {
    if (!analysis?.reply) return;

    try {
      await navigator.clipboard.writeText(analysis.reply);
      setCopied(true);
    } catch {
      setError("Could not copy the reply. Please select and copy it manually.");
    }
  }

  const confidence = analysis ? Math.round(analysis.sentiment.confidence * 100) : 0;
  const positive = analysis?.sentiment.label === "Positive";
  const canAnalyze = review.trim().length >= 8 && !loading;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="ReviewRadar home">
            <RadarMark />
            <span className="text-lg font-semibold tracking-tight text-slate-900">ReviewRadar</span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:flex">
            <span className="size-1.5 rounded-full bg-teal-500" />
            Your review, understood
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <section className="mb-9 max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-teal-800">
            <SparkleMark />
            Review insights
          </p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl">
            Find the signal in
            <span className="text-teal-700"> every review.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Understand how a customer feels, what matters to them, and how to reply with care.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.28)] sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Add a customer review</h2>
                <p className="mt-1 text-sm text-slate-500">Paste the review you want to understand.</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                01 / 01
              </span>
            </div>

            <label htmlFor="review" className="sr-only">
              Customer review
            </label>
            <textarea
              id="review"
              name="review"
              value={review}
              onChange={(event) => {
                setReview(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleReviewKeyDown}
              maxLength={MAX_LENGTH}
              rows={7}
              placeholder='"The quality is fantastic and delivery was quick. I will definitely order again!"'
              aria-describedby="review-hint review-count"
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-[15px] leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p id="review-hint" className="text-xs text-slate-400">
                Try a sample or write your own
              </p>
              <p id="review-count" className="text-xs tabular-nums text-slate-400" aria-live="polite">
                {review.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setReview(SAMPLES.positive);
                  setError(null);
                }}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <span className="mr-1.5 text-emerald-600">+</span>
                Positive sample
              </button>
              <button
                type="button"
                onClick={() => {
                  setReview(SAMPLES.negative);
                  setError(null);
                }}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <span className="mr-1.5 text-rose-600">+</span>
                Negative sample
              </button>
            </div>

            <button
              type="submit"
              disabled={!canAnalyze}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/15 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-4 animate-spin"
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Reading your review...
                </>
              ) : (
                <>
                  Analyze review
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                    <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Tip: press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans">Ctrl</kbd>{" "}
              + <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans">Enter</kbd>{" "}
              to analyze
            </p>
          </form>

          <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.28)] sm:p-7">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <SparkleMark />
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
              A clearer picture, in seconds
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              ReviewRadar turns a customer&apos;s words into a helpful next step.
            </p>

            <ol className="mt-6 space-y-5">
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">Read the sentiment</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    See whether the feedback is positive or negative.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">Get the why</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    A short explanation highlights what stood out.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">Reply with confidence</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Start with a thoughtful, ready-to-use response.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-auto border-t border-slate-100 pt-5">
              <p className="text-xs leading-5 text-slate-400">
                Sentiment uses a lightweight placeholder model. Gemini powers the explanation and
                suggested reply when your API key is configured.
              </p>
            </div>
          </aside>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
          </p>
        ) : null}

        {analysis ? (
          <section className="mt-10" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                  Analysis complete
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  Here&apos;s what we found
                </h2>
              </div>
              <span className="text-xs text-slate-400">Based on the review you shared</span>
            </div>

            <article
              className={`overflow-hidden rounded-2xl border p-5 sm:p-7 ${
                positive
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-rose-200 bg-rose-50/70"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex size-12 items-center justify-center rounded-xl text-xl ${
                      positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                    aria-hidden="true"
                  >
                    {positive ? "+" : "-"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Sentiment</p>
                    <p className={`text-2xl font-semibold ${positive ? "text-emerald-800" : "text-rose-800"}`}>
                      {analysis.sentiment.label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">{confidence}%</p>
                  <p className="text-xs text-slate-500">confidence</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${
                    positive ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Prediction by {analysis.sentiment.source === "local-model" ? "local model" : "keyword rules"}
              </p>
            </article>

            {analysis.warning ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {analysis.warning}
              </p>
            ) : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.28)] sm:p-6">
                <div className="flex items-center gap-2 text-teal-700">
                  <SparkleMark />
                  <h3 className="text-sm font-semibold text-slate-900">Why it feels this way</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {analysis.explanation ?? "Gemini could not provide an explanation this time."}
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.28)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">A thoughtful reply</h3>
                  {analysis.reply ? (
                    <button
                      type="button"
                      onClick={() => void copyReply()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                    >
                      {copied ? (
                        <>
                          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-3.5">
                            <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-3.5">
                            <rect x="7" y="7" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v7A1.5 1.5 0 0 0 5.5 14H7" stroke="currentColor" strokeWidth="1.4" />
                          </svg>
                          Copy reply
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {analysis.reply ?? "Gemini could not suggest a reply this time."}
                </p>
              </article>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-slate-200/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-medium text-slate-500">ReviewRadar</span>
          <span>Small insights. Better customer conversations.</span>
        </div>
      </footer>
    </div>
  );
}
