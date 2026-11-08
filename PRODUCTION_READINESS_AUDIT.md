# Production Readiness Audit — ContractCheck

Inspection date: 2026-11-06 · Owner: Buttercode Systems (buttercode101)
Repository: https://github.com/buttercode101/ContractCheq · Branch: `main`
Starting commit: `8f77981bfc5428a01c30c3bb37cefe663e6f26a4` (2026-11-05)
Tested commit: `8f77981` + uncommitted fix set (see DEFECT_REGISTER.md D-001–D-003)
Environment: Termux/Android 14, Node v26.3.1 (repo engines: 24.x — see note), npm 12.2.1
Canonical domain: https://contractcheck.online · Deployment: Vercel (`server: Vercel`, region cpt1)

## Architecture map
- Runtime: Node.js 24.x target, Express 4.22.3 (`server/index.js`, 586 lines). No bundler; vanilla/React-CDN frontend (`public/`).
- Pipeline: upload (multer, 4MB Vercel / 12MB local) → PDF (`pdf-parse`) / PDF-OCR (canvas render) / image OCR (`tesseract.js`) / plain text → SA/UK rules engine (`server/riskEngine.js`) → optional AI enrichment (OpenRouter/Groq/TinyFish, off by default) → freemium unlock → Paystack verify → report retrieval.
- Storage: Supabase REST backend (`server/store.js`, raw fetch — no `@supabase/*` dep) with Vercel Blob + local file fallback.
- Deployment: Vercel Build Output API, `vercel.json` buildCommand `npm test && node build-vercel.js` (packages `server/ + node_modules/ + public/` into `.vercel/output/functions/api`).

## Feature inventory (verified codes)
| Feature | Status | Evidence |
|---|---|---|
| PDF text extraction | WORKING | `extraction.test.js` vector/blank/signature cases pass |
| PDF OCR (scanned) | WORKING | `extraction.test.js` pdf-ocr case pass |
| Image OCR (photo PNG) | WORKING (fixed) | D-001/D-002 portability fix; 4/4 extraction tests pass |
| Risk rules SA/UK | WORKING | `riskEngine.test.js` pass; smoke ZA 85 / UK 90 |
| Paystack checkout | PARTIALLY WORKING | Simulated verification tests pass; **no live payment tested (BLOCKED)** |
| Report retrieval / credit unlock | WORKING | `store` + payment-journey tests pass (simulated) |
| AI enrichment | WORKING (opt-in) | Tests pass with test keys; prod ON in health vs OFF in `.env.example` (drift, P2 doc) |
| Admin/branch protection | FIXED 2026-11-06 | D-003 enabled via API, verified by re-GET |

## Dependency inventory
159 packages, `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities (2026-11-06).
Node engine mismatch: repo requires 24.x, test env is v26.3.1 — tests pass; CI runs 24.

## Test inventory
23 test files in `server/*.test.js`; `npm test` = 134 tests, 134 pass, 0 fail (2026-11-08, final phase).
`npm run test:smoke` = SMOKE OK. Browser verification workflow (Playwright chromium/firefox/webkit) green at HEAD.

## Deployment map
GitHub `main` → `production-ci.yml` (npm ci → test → smoke → audit) → Vercel build → `contractcheck.online`.
Live 2026-11-06: HTTP 200, `/api/health` 200 `{"ok":true,"version":"3.1.2",...}`, CSP + HSTS + frame-ancestors live.
Vercel source/deployment equality: UNVERIFIED (no Vercel API proof gathered — see RELEASE_ACCEPTANCE_REPORT.md).

## Existing defects
See DEFECT_REGISTER.md. D-001 (P2, OCR cachePath) fixed. D-002 (P2, test font) fixed. D-003 (P2, branch protection) fixed + verified. D-004 (P2, `.env.example` Supabase vars) fixed. D-005 (P3, coverage badge aspirational) open. D-006 (P3, 40 stale branches) open — cleanup deferred (not destructive without owner confirmation of branch list).

## Initial acceptance score
Core 18/20 · E2E 16/20 · UI/UX 12/15 · Responsive 7/10 · Arch/Data 8/10 · Security 8/10 · Perf 4/5 · A11y 4/5 · Ops 4/5 = **81/100 — CONDITIONAL** (live payment + physical device BLOCKED; see RELEASE_ACCEPTANCE_REPORT.md).
