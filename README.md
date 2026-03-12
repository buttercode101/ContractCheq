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

## API split

- `/api/extract-text`: OCR.Space extraction for image uploads and PDF OCR fallback.
- `/api/analyze-text`: Groq legal risk analysis on extracted text.

The browser no longer receives provider API keys directly.
