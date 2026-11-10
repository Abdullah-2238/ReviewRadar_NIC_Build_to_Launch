# ReviewRadar

Paste a customer review. The app predicts Positive or Negative, then asks Gemini for an explanation and a polite reply.

## Run

```bash
cd review-radar
copy .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 and add your Gemini API key to `.env.local` as `GEMINI_API_KEY`.

Sentiment still works without a key. The explanation and reply need the key.

## How the sentiment step is swapped later

`lib/sentiment.ts` calls `loadLocalModel()` first. That reads `public/model.json`. The file ships with `"ready": false`, so the keyword rules run. Set `ready` to `true` and add `vocabulary`, `weights`, and `bias` to use the local model instead.
