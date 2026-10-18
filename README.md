# ContractCheck SA v3.1

The default `main` branch is the source for the `contractcheck-sa-v3` Vercel project. Both `contractcheck-sa-v3.vercel.app` and `contract-check-v3-sa.vercel.app` are production domains of that project.

## Paid plain-language reading guide

Every full-report unlock includes a searchable guide to the extracted contract wording, not just risk flags. Each text section includes topic explanations, simpler wording for common legal phrases where supported, its original wording, exact amounts and time periods, context-sensitive legal-word definitions and questions to ask. Conditions, negations and cross-references are retained. Unrecognised wording and references needing context are marked for closer reading.

The guide uses the local explanation engine; it does not require optional AI enrichment or send additional document text to third parties. It covers at most the first 400 extracted text sections and reports the included/total count. This is a reading aid, not a full paraphrase of every possible contract, a replacement agreement, a guarantee of finding hidden clauses or a decision about enforceability. Missing attachments and unreadable text cannot be explained.

The guide is included in the PDF export and the public full-report examples. It is withheld server-side from free previews and returned through the existing verified-credit unlock flow. Older saved reports without a guide show a clear rescan message.

## Run

`npm ci` then `npm start`. Run `npm test` and `npm run test:smoke`.

Vercel build: tests run before `build-vercel.js` packages the Express server and static assets using the Build Output API. Uploads use /tmp. PDF extraction uses the PDFParse API. OCR language and WebAssembly assets are included in the server bundle. Server integration tests explicitly isolate their local ledger from production storage settings.

## Environment

Connect a **private** Vercel Blob store to this project. The SDK uses BLOB_STORE_ID and Vercel-managed OIDC. Local development can use BLOB_READ_WRITE_TOKEN or the local file store.

Set PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY, optional GROQ_API_KEY/GROQ_MODEL and TINYFISH_API_KEY as server-side environment variables. Set CRON_SECRET for the daily expired-analysis cleanup. Never commit credentials.

Pricing: R19 single report, R39 three reports, R99 ten reports. Receipts must match the paid product, exact ZAR amount and Paystack customer email. Re-verification does not add credits. Unlocks consume one credit atomically and retries of the same report are idempotent. The receipt is a bearer credential stored in the purchaser's browser.

Scans expire after 48 hours and are removed by daily cleanup. Saved private reports include original extracted wording needed by the guide. Uploaded originals are deleted after processing. Optional enrichment sends document excerpts to the selected third-party services. Browser notes remain on the device.

Not legal advice. Rules-based risk screening does not prove legal validity or completeness. A real payment transaction has not been run as part of deployment verification.
