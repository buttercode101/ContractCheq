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

### Reliability and receipt recovery (3.1.1)

Pricing includes receipt restoration using the original Paystack reference and receipt email. The server verifies the provider's original product, exact ZAR amount and customer; restoring cannot create replacement credits. Existing report unlocks remain idempotent even at zero credits. No charge is made by restoration.

Both text inputs and extracted uploads are limited to 200,000 characters. Analytics failures cannot invalidate completed scans or consume a credit without returning the report; retrying the same report is safe. Telemetry accepts only enumerated labels and numeric metrics. Optional provider calls have bounded timeouts and AI findings require quoted evidence from the document; this does not verify the AI's legal conclusions.

The same hashed-script CSP and anti-framing headers cover Express and Vercel static routes. Inline styles remain permitted for React layout. Paystack checkout and fonts have explicit external origins. React and jsPDF 4.2.1 are pinned npm dependencies served locally, included in the dependency audit and packaged identically for local development and Vercel.

### Reproduced flow fixes (3.1.2)

Navigating away from an upload or example cancels waiting for it. Late responses and errors cannot replace the current page, and an older request cannot replace a newer example. Client report requests have a 75-second timeout. Cancellation does not undo processing already received by the server.

Short text layers, including signature-page labels, are retained even when OCR returns little text or a renderer paints white. Limited extraction is flagged for comparison with the original. Packaged PDF standard fonts are explicitly supplied to the renderer.

Regression coverage executes the shipped React event handlers against the real Express API and a temporary ledger, mocking only the payment provider boundary. It covers rejected payment amounts and recovery when the first unlock response is lost after a credit was consumed. This is not evidence of a real settled payment.
