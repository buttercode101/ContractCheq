# ContractCheck full-stack audit — second pass, 22 October 2026

Baseline: main `b3b093e005c7ec434bddb80110e45667e52d3f7a`, production `contractcheck.online`. This report uses current code, new executions and production responses; earlier reports are historical context. Final release/check results are recorded in the associated PR.

## Running reality and architecture

The product screens uploaded contracts against selected SA/UK rules. A free report exposes a score and up to three findings. Verified Paystack purchases unlock complete findings, a source-linked local reading guide, payment/obligation summaries, review questions, notes and PDF export. It does not generate contracts, sign documents, send reminders or provide a complete legal opinion.

- `public/index.html`: active React application, upload, examples, pricing, payment/receipt recovery, report and legal views. `public/app.css`: shared responsive design system.
- `public/contract-actions.js` and `public/checklist-tools.js`: opt-in device checklists, bounded JSON backup/restore, progress and user-confirmed all-day calendar export. These records outlive server reports until removed locally.
- `server/index.js`: Express routes and orchestration; PDF text/OCR, image OCR, optional external AI, safe free response projection, payment verification and unlock. Root `index.js` is a compatibility export, not an abandoned second app.
- `server/riskEngine.js`, `plainLanguage.js`, `reportContext.js`, `actionPlan.js`: deterministic findings, reading sections, role/date context and source-linked actions. Reading coverage is limited to 400 sections, action items to 80; these are disclosed, not full CLM capabilities.
- `server/store.js`: private Vercel Blob in production; isolated filesystem ledger locally. Analysis access expires at 48 hours, with daily physical cleanup. Credits use an optimistic-concurrency ledger and idempotent unlocks. Payment and event records currently have no automatic deletion schedule; Privacy discloses this.
- `server/siteConfig.js`, `securityHeaders.js`, `vendorAssets.js`, `build-vercel.js`, `vercel.json`: canonical host enforcement, exact-script CSP hashes, local pinned frontend libraries, static/Express packaging, Cape Town functions and authenticated daily cleanup.
- `public/samples/`, `server/demoSamples.js`, `server/fixtures/` and `server/test-contracts.json` support public examples and regression tests; no evidence supports deleting them as dead assets. No tracked production credentials, build output, upload directory or large OCR models were found in the 58-file baseline tree.

## Reproduced issues and fixes

| Priority | Observed behavior | Files and exact fix |
| --- | --- | --- |
| High | A 60-byte all-NUL `.txt` and a 60-byte invalid UTF-8 file produced HTTP 200, score 18, “Low Risk”, extraction confidence 1. The NUL case was also reproduced against production. | `server/index.js`: fatal UTF-8/UTF-16 decoding and control-byte validation before analysis/storage; reject corrupted input with actionable HTTP 422 and no score. Validate JSON text input too. `server/inputSafety.test.js`: malformed-input and non-persistence regressions, plus valid Unicode/BOM coverage. |
| Medium | A worker whose asynchronous startup finished after the OCR deadline was never terminated. A controlled late-start test failed with termination count 0. | `server/index.js`, `extractFromImage`: cancellation state and one shared termination promise; stop a late worker before decoding/recognition. Regression requires exactly one termination and zero recognition calls. |
| Medium | An invalid jurisdiction with a damaged PNG triggered image decoding and returned an image error instead of rejecting the option. | `server/index.js`, `/api/analyze`: validate jurisdiction and perspective before expensive extraction, retaining file cleanup in `finally`. `server/inputSafety.test.js` verifies HTTP 400 for both invalid options. |
| Low | README said an authenticated AI completion was still unverified until a key was configured. Production now successfully completes opt-in AI. | `README.md`: replace the stale activation statement with the dated observed request and its limits; document text-encoding support and worker cleanup. |

`scripts/verify-edge-browser.cjs` adds a real binary-file UI journey: readable error, no risk gauge, then immediate success with a valid contract. The existing browser matrix continues to cover navigation, checkout, saved checklists, payment recovery, API outages and accessibility.

## Fresh production observations before release

| Check | Actual response |
| --- | --- |
| Health/config | HTTP 200; private storage, payment configuration and AI enabled; prices 1900/3900/9900 ZAR cents, 4 MB upload limit. Configuration is not evidence of payment settlement. |
| Unauthenticated credits / metrics / cleanup | HTTP 401 / 403 / 401; API responses use `Cache-Control: no-store` and CSP. |
| Public SA lease text | HTTP 200; score 85, three findings, plain-text extraction. |
| Public UK tenancy text | HTTP 200; UK jurisdiction, score 90, four findings. |
| Generated two-page lease PDF | HTTP 200; `pdf-parse`, two pages, score 73, later-page entry clause detected. |
| Generated clear contract PNG | HTTP 200; `tesseract`, score 73, three findings. |
| Deliberately corrupt PDF | HTTP 422 with damaged/password-protected PDF guidance. |
| Public employment sample, opt-in AI | HTTP 200; `aiStatus: completed`, score 79, five findings; 23.4 seconds including network overhead. |
| Paid-field exclusion | All successful free-upload responses above withheld `plainLanguageGuide`, `actionPlan` and `priorities`. |
| Runtime errors | Vercel grouped error query returned no errors in the selected one-hour window. This is bounded evidence, not proof of universal uptime. |

## Quality, hygiene and follow-up work

No dependency update is justified by the fresh `npm audit --omit=dev --audit-level=high`: zero vulnerabilities. Keep locked dependency installation and audit gates. Tests exercise actual Express routes, current frontend handlers, OCR fixtures, source retention, receipt replay, credit concurrency, response loss, malformed AI and exports; payment-provider responses in those tests are synthetic.

Prior UI fixes remain relevant: upright hero, shorter aligned pricing cards, full-feature disclosure, descriptive route titles, legal headings, support mailto, accessible notice controls and configuration retry. Avoid changing the design without a new observed failure.

Prioritized follow-ups and suitable PR scopes:

1. **Define payment/event retention and user deletion policy** — `server/store.js`, Privacy view in `public/index.html`: specify the required financial-record lifetime and deletion/recovery behavior before adding cleanup. Do not silently delete purchased credits or claim an existing automatic schedule.
2. **Split server responsibilities without changing API contracts** — `server/index.js`: extract decoder/OCR, payment and AI adapters behind existing route tests. This is maintainability work; no rewrite is required for the fixes above.
3. **Separate frontend report and checkout modules** — `public/index.html`, `server/securityHeaders.js`, `build-vercel.js`: preserve exact CSP behavior, accessible focus management and current user journeys while reducing the large single application script.

The implemented fixes belong in one PR: **Reject corrupted text and clean up OCR workers after timeouts**. Its description should state the binary-file false-success trigger, strict decoding and cancellation changes, regression evidence and production verification.

## Verification limits

No real payment was submitted. A configured Paystack key and successful synthetic verify/unlock tests do not prove a genuine settled transaction, refund or bank receipt. Responsive browser emulation and CI screenshots are not tests on physical Android/iOS devices. External AI is optional and can fail; successful completion does not certify its legal conclusions. Text extraction/rule coverage is deliberately bounded. No software audit establishes “100% without fail”.

Deletion of old Vercel domain records is separate infrastructure work; this pass does not claim it happened. Canonical-origin guards remain in the executable routing code.
