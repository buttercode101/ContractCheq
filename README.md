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

This repo now includes Vercel API routes:
- `api/extract-text.js` (OCR.Space)
- `api/analyze-text.js` (Groq)

Set these in Vercel project environment variables (Production + Preview):
- `OCR_SPACE_API_KEY`
- `GROQ_API_KEY`

If you see an error like `Unexpected token 'T'... is not valid JSON`, the frontend likely received an HTML/text error page instead of JSON from `/api/*` (usually missing route or env var). The app now reports a clearer non-JSON API error sample to help diagnose this quickly.

## API split

- `/api/extract-text`: OCR.Space extraction for image uploads and PDF OCR fallback.
- `/api/analyze-text`: Groq legal risk analysis on extracted text.

Provider API keys remain server-side.
