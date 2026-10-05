# ContractCheck SA v3 — separate deployment

Source: user-supplied ContractCheck-SA-FINAL.zip. This deployment is independent of existing ContractCheck production projects.

## Run

`npm ci` then `npm start`. Run `npm test` and `npm run test:smoke`.

Vercel entry: index.js exports the Express server. Uploads use /tmp. PDF extraction uses the current PDFParse API. OCR language and WebAssembly assets are included in the server bundle.

## Environment

Connect a **private** Vercel Blob store to this project. The SDK uses BLOB_STORE_ID and Vercel-managed OIDC. Local development can use BLOB_READ_WRITE_TOKEN or the local file store.

Set PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY, optional GROQ_API_KEY/GROQ_MODEL and TINYFISH_API_KEY as server-side environment variables. Set CRON_SECRET for the daily expired-analysis cleanup. Never commit credentials.

Pricing: R19 single report, R39 three reports, R99 ten reports. Receipts must match the paid product, exact ZAR amount and Paystack customer email. Re-verification does not add credits. Unlocks consume one credit atomically and retries of the same report are idempotent. The receipt is a bearer credential stored in the purchaser's browser.

Scans expire after 48 hours and are removed by daily cleanup. Uploaded originals are deleted after processing. Optional enrichment sends document excerpts to the selected third-party services.

Not legal advice. Rules-based risk screening does not prove legal validity or completeness. A real payment transaction has not been run as part of deployment verification.
