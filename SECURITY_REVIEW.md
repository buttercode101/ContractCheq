# Security Review — ContractCheck

Date: 2026-11-06 · Commit `8f77981` + fix set.

## Observed (verified)
- Live headers: CSP (sha256-pinned script + Paystack allowlist, `object-src 'none'`, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, HSTS `max-age=63072000` (live) / siteConfig 15552000 in code — live value is stronger, not a defect.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- `helmet`, `express-rate-limit`, server-side validation, multer fileFilter present in `server/index.js`.
- Storage diagnostic does not leak credentials (test asserts); health endpoint exposes booleans only, no secrets.
- Branch protection: FIXED 2026-11-06 (D-003) — strict checks + no force-push.

## Not verified / gaps
- Unauthorised-access test: no IDOR/tenant-isolation test found for report retrieval (`/api/report/:id`-style routes). Marked UNVERIFIED — recommend adding a test that fetches a report with a wrong/unknown token and expects 404/403.
- File upload: malicious-content (polyglot) handling — fileFilter is mimetype/extension based; no magic-byte sniff verified. Recommend magic-byte check (P2 hardening, not a confirmed bypass).
- Prod config drift: `/api/health` shows `ai_enrichment:true`, groq/openrouter/tinyfish all true in production while `.env.example` defaults are off — cost/consent surface. Confirm this is intentional; if not, set in Vercel env.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only by design (raw fetch from `server/store.js`); never ship to `public/`. Verified: no `@supabase/*` client dep, no key in frontend files searched.

## Secrets hygiene
- No secrets in repo (`.gitignore` + test-env scrub verified in `scripts/test-env.cjs`).
- This report contains no credentials.
