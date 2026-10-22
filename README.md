# ContractCheck SA v3.1

The default `main` branch is the source for the `contractcheck-sa-v3` Vercel project. The only public site origin is **https://contractcheck.online**. Do not add www, legacy domains, branch aliases, or preview domains as public entry points.

Production static routing and the API reject other hosts. Local development remains available on localhost. The only exception is authenticated `GET /api/cleanup`, because Vercel Cron may use a generated deployment hostname; the configured `CRON_SECRET` is mandatory. Keep Vercel Deployment Protection enabled for generated deployment URLs. Remove obsolete project domains and aliases in Vercel rather than redirecting them. Domain registrations and unrelated email DNS records must be retained.

The canonical origin and production host policy live in `server/siteConfig.js`. The HTML canonical and Open Graph URL identify the same origin. No environment variable can silently change the production site identity.

## Paid plain-language reading guide

Every full-report unlock includes a searchable guide to the extracted contract wording, not just risk flags. Each text section includes topic explanations, simpler wording for common legal phrases where supported, its original wording, exact amounts and time periods, context-sensitive legal-word definitions and questions to ask. Conditions, negations and cross-references are retained. Unrecognised wording and references needing context are marked for closer reading.

The guide uses the local explanation engine; it does not require optional AI enrichment or send additional document text to third parties. It covers at most the first 400 extracted text sections and reports the included/total count. This is a reading aid, not a full paraphrase of every possible contract, a replacement agreement, a guarantee of finding hidden clauses or a decision about enforceability. Missing attachments and unreadable text cannot be explained.

The guide is included in the PDF export and the public full-report examples. It is withheld server-side from free previews and returned through the existing verified-credit unlock flow. Older saved reports without a guide show a clear rescan message.

## Run

`npm ci` then `npm start`. Run `npm test` and `npm run test:smoke`.

Vercel build: tests run before `build-vercel.js` packages the Express server and static assets using the Build Output API. Uploads use /tmp. PDF extraction uses the PDFParse API. OCR language and WebAssembly assets are included in the server bundle. Server integration tests explicitly isolate their local ledger from production storage settings.

## Environment

Connect a **private** Vercel Blob store to this project. The SDK uses BLOB_STORE_ID and Vercel-managed OIDC. Local development can use BLOB_READ_WRITE_TOKEN or the local file store.

Set PAYSTACK_PUBLIC_KEY, PAYSTACK_SECRET_KEY, optional OPENROUTER_API_KEY/OPENROUTER_MODEL, GROQ_API_KEY/GROQ_MODEL and TINYFISH_API_KEY as server-side environment variables. Set CRON_SECRET for the daily expired-analysis cleanup. AI enrichment is off unless AI_ENRICHMENT_ENABLED=true and the upload opts in. The default model is deepseek/deepseek-v4-flash. An enabled flag without a configured inference provider keeps the AI control disabled. Groq fallback requires AI_ALLOW_GROQ_FALLBACK=true; otherwise OpenRouter failure returns the rules-based report with an explicit unavailable status. External research requires AI_RESEARCH_ENABLED=true and is off by default. Redaction covers common email/phone/ID patterns, not all personal data. TinyFish receives generic legal-topic queries. Never commit credentials.

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

## Role checklist and contextual dates

The optional role selector tailors full-report review questions for tenants, landlords, employees, employers, freelancers/service providers and clients. It does not change legal rules or scores, diagnose missing clauses, or approve signing. Mismatched roles are identified in the report. Full reports and exported PDFs include validated ISO and written day-month-year dates and selected periods with source-section labels and surrounding text. This limited extraction is not a complete deadline calendar. Free API previews use an explicit field allowlist and omit the checklist and source contexts.


## Payment summaries and confirmed checklists

New full reports and examples include source-linked payment wording, recognised obligations and editable clarification questions. Service reviews also surface deliverable, revision, acceptance, scope-change and ownership questions. These limited keyword checks use only the reading guide’s included sections. They do not calculate a balance, verify payment, change the risk score or decide enforceability. Unknown parties and missing wording are explicitly labelled for confirmation.

Checklist items start unconfirmed. A calendar event requires the user to confirm both the item and a manually entered valid calendar date. Relative periods, business days and triggers are never converted into deadlines automatically. The all-day `.ics` export includes the source excerpt; it does not send reminders or connect to a calendar account.

Saving is explicitly opt-in. `/checklists` reads up to 10 local checklists (80 items each) from the separate `cc_checklists_v1` browser key. Clause excerpts and confirmed progress persist beyond the server report’s 48-hour access window until removed or browser data is cleared. This does not grant access to an expired or unpaid report. JSON backup/restore is device-independent, versioned, bounded and validated; imported text is rendered through React without HTML interpretation. Payment references and receipt credentials are not included. PDF export contains the report’s original action suggestions; use the checklist backup to preserve edited progress and dates.


## OpenRouter activation and limits

Add `OPENROUTER_API_KEY` as a Production Secret in the existing Vercel project, set `AI_ENRICHMENT_ENABLED=true`, and redeploy. `OPENROUTER_MODEL` defaults to `deepseek/deepseek-v4-flash`; `.env.example` contains configuration names only. No production key is included in the repository. Use a separately capped OpenRouter app key; request-level token/price limits do not impose an account-wide spending limit.

Calls require upload consent, redact common email/phone/ID patterns, and review at most 4,000 normalised characters (configured limits are bounded to 200–4,000). The request allows 1,600 output tokens, disables reasoning, requests JSON, sorts providers by price, requires parameter support and zero retention, and disallows data collection. Provider price ceilings are USD 0.10 per million input tokens and USD 0.30 per million output tokens, with zero per-request fees. If no endpoint matches, it fails safely to the rules-based result; privacy/price filters are never relaxed automatically. This is a limited excerpt review and does not guarantee legal accuracy or complete coverage. Malformed/truncated responses are rejected and their content is not logged.

Reference: https://openrouter.ai/docs/guides/routing/provider-selection and https://openrouter.ai/docs/guides/best-practices/reasoning-tokens . Model availability and pricing must be checked before activation; a real authenticated completion cannot be verified until the key is configured. Paystack live settlement separately requires a genuine completed transaction; simulated verification is not settlement evidence.
