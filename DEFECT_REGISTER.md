# Defect Register — ContractCheck

Date: 2026-11-06 · Starting commit `8f77981` · Tested with fix set below.

## D-001 — OCR cachePath hardcoded to `/tmp` (P2, FIXED)
- Root cause: `server/index.js:131` `cachePath:'/tmp'` — `/tmp` does not exist on Termux/Android; tesseract worker init fails, image OCR returns 422 "Could not extract enough text".
- Reproduction: `npm test` → `extraction.test.js:48` 422≠200 (127/128 pass).
- Fix: `os.tmpdir()` (returns `/tmp` on Vercel/Linux, correct dir elsewhere). Also unified Vercel uploadDir. Commit: pending push (see RELEASE_ACCEPTANCE_REPORT.md).
- Retest: `extraction.test.js` 4/4 pass; full suite 128/128.

## D-002 — Test fixture font renders blank on Termux (P2, FIXED)
- Root cause: fixture used `'40px sans-serif'`; on Termux that family renders 0 dark pixels (font missing silently), so the "clear PNG" was blank and OCR correctly found nothing.
- Evidence: pixel probe — sans-serif 0 px, serif 5,278 px.
- Fix: fixture font → `'40px serif'` with explanatory comment. CI (Ubuntu) unaffected — serif exists there too.
- Retest: 4/4 extraction tests pass.

## D-003 — No branch protection on main (P2, FIXED + VERIFIED)
- Evidence: `gh api .../branches/main/protection` → 404 before fix.
- Fix: PUT protection — strict required status checks [`verify`, `browsers (chromium/firefox/webkit)`], `enforce_admins=false` (owner not locked out), force-push/deletion blocked.
- Verification: re-GET returns the 4 contexts, strict=true, force=false (2026-11-06).

## D-004 — `.env.example` missing Supabase vars (P2, FIXED)
- Evidence: `server/store.js:12-13` reads `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_TABLE` (commits #31–#33); `.env.example` listed none → new deploys silently fall back to Blob/local.
- Fix: added all three vars with safe defaults (`SUPABASE_TABLE=contractcheck_records`).

## D-005 — Coverage badge aspirational (P3, OPEN)
- `README.md` shows coverage-80% shield; no workflow runs a coverage tool; `package.json` has no coverage script. Either wire c8 coverage or remove badge. Deferred — needs owner choice (badge removal vs CI wiring).

## D-006 — 40 stale remote branches (P3, OPEN)
- Incl. 6× `codex/deep-search-using-ocr.space-and-groq*`. Cleanup needs owner confirmation of branch list before deletion (not destructive-by-assumption).

## Policy notes
- No P0/P1 defects confirmed. No severity downgrades.
- Dates/jurisdiction ground-truth fixtures, refund flow, IDOR test, storage TTL test: coverage gaps (UNKNOWN in ACCEPTANCE_TEST_PLAN.md), not confirmed defects.
