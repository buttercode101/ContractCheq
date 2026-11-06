# Five-Product Programme Tracker — Buttercode Systems

Date: 2026-11-06 · Owner: buttercode101 · Organisation: Buttercode Systems

## Product index

| Product | Repo | Live URL | Tests | Score | Verdict |
|---|---|---|---|---|---|
| ContractCheck | buttercode101/ContractCheq @ c869c5b | https://contractcheck.online | 128/128 | 81/100 | CONDITIONALLY READY |
| ScreenNote | buttercode101/ScreenNote @ e15d7a1 | https://screennote-woad.vercel.app | 112/112 | 78/100 | NOT READY for handset claims |
| Habitat | buttercode101/Habitat @ fb8aefe | https://habitat-za.vercel.app | 116+8+1 | 73/100 | NOT READY as production service |
| OrderPilot | buttercode101/OrderPilot @ 6b80566 | https://orderpilot-za.vercel.app | 59/59 in final run | 75/100 | NOT READY (tsx-era blocker now resolved in final run; remaining gates below) |
| InvoiceFlow | buttercode101/InvoiceFlow @ 3466e9b | https://invoiceflow-za.vercel.app | 67/67 | 72/100 | NOT READY (vitest/device gates) |

Scores reflect verified evidence on 2026-11-06: 128/128, 112/112, 116+8+1, 59/59, 67/67 with noted gaps. No P0/P1 confirmed at baseline; OrderPilot better-auth critical (GHSA-44jh-23m7-hpcf) recorded as P2 (auth scaffold off; breaking 1.7.18 upgrade not forced).

## Branch protection (verified via API re-GET 2026-11-06)
ContractCheck: verify + 3 browsers · ScreenNote: test-and-build, build · Habitat: 4x test, web-build, dependency-audit · OrderPilot: test · InvoiceFlow: verify, build. All strict=true, enforce_admins=false (owner not locked out), force-push/deletion blocked.

## Changes pushed this programme
- ContractCheck: OCR os.tmpdir() portability fix + fixture font fix (D-001/D-002), .env.example Supabase vars (D-004), branch protection (D-003), factual test badge replaces aspirational coverage badge (D-005).
- ScreenNote: version/limit doc corrections, honest test glob, .env.example, npm audit CI gate, branch protection.
- Habitat: root .env.example, removed duplicate web/vercel.json, npm + pip dependabot coverage.
- OrderPilot: .env.example (inferred var list), CI typecheck + informational npm audit, zod pinned 4.6.7 (high GHSA-mrhx fixed), seroval bumped, better-auth critical documented with exact fix path.
- InvoiceFlow: version aligned 0.3.1→0.4.0, .env.example added, branch protection, npm audit clean (0 vulns on installed tree).

## Credentials / infra verification
Cloudflare credentials stored owner-only at ~/.hermes/creds/cloudflare.txt (0600, values never in chat/docs/repos — keys rotatable on request). API token verified live: authenticated but R2 not yet enabled on the account (Cloudflare error 10042: enable R2 via Dashboard). Owner action: enable R2 in Cloudflare Dashboard, then re-verify bucket access.

## Remaining owner actions (cannot be implemented by agent alone)
1. Physical-device passes (ScreenNote handset capture, InvoiceFlow IndexedDB cross-device) — no device access.
2. AI/pricing separation proof (OrderPilot, InvoiceFlow per §6.4) — needs live-key or mock decision.
3. better-auth 1.7.18 breaking upgrade approval (OrderPilot) — needs API compatibility review.
4. Vercel commit-equality proofs for all 5 (need Vercel API access).
5. Supabase 1 GB budget spend alert (owner account action).
6. Enable Cloudflare R2 in Dashboard (see above).
7. vitest install decision (InvoiceFlow test:ui/test:product) — network timeout on Termux; MJS suite 67/67 passes without it.

## Deliverables per product (7 docs in each repo)
PRODUCTION_READINESS_AUDIT.md · ACCEPTANCE_TEST_PLAN.md · DEFECT_REGISTER.md · SECURITY_REVIEW.md · RESPONSIVE_COMPATIBILITY_REPORT.md · PERFORMANCE_REPORT.md · RELEASE_ACCEPTANCE_REPORT.md
