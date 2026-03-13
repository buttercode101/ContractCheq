<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ContractCheck SA

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Create `.env.local` (or export in shell) with:
   - `OCR_SPACE_API_KEY=...`
   - `GROQ_API_KEY=...`
3. Start app + local API server:
   `npm run dev`
4. Open `http://localhost:3000`

## Deployment (Vercel)

This repo includes Vercel API routes:
- `api/extract-text.js` (OCR.Space)
- `api/analyze-text.js` (Groq)
- `api/version.js` (deployed version visibility)
- `api/health.js` (env presence + health)

Set these in Vercel environment variables (Production + Preview):
- `OCR_SPACE_API_KEY`
- `GROQ_API_KEY`

## Diagnostics checklist

1. Hit `/api/version` in deployed app and verify commit hash matches expected deploy.
2. Hit `/api/health` and confirm `OCR_SPACE_API_KEY` and `GROQ_API_KEY` are both `true`.
3. If analysis fails, inspect returned `error.code`:
   - `GROQ_RATE_LIMIT`
   - `GROQ_INVALID_JSON`
   - `ANALYSIS_SCHEMA_FAIL`
   - `OCR_PROVIDER_HTTP_ERROR`
   - `OCR_EMPTY_TEXT`

## API behavior

- Every API response includes:
  - `x-contractcheck-version`
  - `x-request-id`
- All API errors are structured as:
  - `{ ok: false, error: { code, message, details } }`

## Notes on free tiers

Groq free-tier models may return variant JSON shapes or fenced JSON text. The backend now extracts JSON robustly and normalizes it to the strict frontend schema before validation.

Provider API keys remain server-side.


## Ingestion safeguards

- Max upload size: 10MB
- Max PDF pages: 40
- OCR fallback for low-density PDFs
- Request queueing on analysis path to reduce free-tier burst/rate-limit failures

## Analysis confidence

A deterministic extraction confidence score is computed before analysis. Low-confidence OCR-heavy inputs trigger a warning banner in UI.

## Tests

- `npm run test:normalizer`
- `npm run test:e2e` (contract-level pipeline tests: clean PDF, scanned PDF OCR fallback, image OCR path, Groq malformed JSON path)
