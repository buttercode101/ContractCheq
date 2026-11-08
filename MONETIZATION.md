# ContractCheck — Monetization Assessment (Phase 8)

**Date:** 2026-11-08 · **Commit:** 0fe660c · **Branch:** flagship-excellence

## Pricing Model (observed, from repo + competitive benchmark)

| Credits | Price (ZAR) | Effective per-report | Channel |
|---|---|---|---|
| 1 | R19 | R19 | Individual consumer |
| 3 | R39 | R13 each | Light multi-user (e.g. job-hunting + renting) |
| 10 | R99 | R9.90 each | Heavy multi-user / B2B2C |

**Source:** `README.md:33`, `PRODUCT_IDENTITY.md:78–82`, `COMPETITIVE_BENCHMARK.md:59,83`

## Free / Paid Boundary (observed)

| Tier | Included | Withheld |
|---|---|---|
| **Free** | Risk score (0–100), risk level, first 3 flagged issues with analysis, decision brief ("Bottom line: sign / negotiate / stop") | Full analysis per finding, plain-language guide (≤400 sections), payment & obligation summaries, role-specific questions, PDF export, device-only checklists, calendar export, all remaining findings |
| **Paid (1 credit)** | Unlock everything above + AI enrichment (optional, consent-gated, ≤4,000 chars, labelled "AI-suggested") | — |

**Source:** `PRODUCT_IDENTITY.md:26–32`, `UX_AUDIT.md:18–20`

## Monetisation Mechanics (observed)

- **Paystack inline checkout** — ZAR amounts: 1900 (=R19), 3900 (=R39), 9900 (=R99) in cents
- **Receipt = bearer credential** — Paystack reference + email; no account required
- **Idempotent unlock** — repeated unlocks of the same report do not consume another credit
- **Refunds** — case-by-case on unlock failure; contact: buttercode101@gmail.com
- **Report retention** — 48 h server store (Supabase/Vercel Blob, private); daily cleanup; PDF export is permanent on the user's device
- **No subscription** — one-time credits only

**Source:** `PRODUCT_IDENTITY.md:78–82`, `UX_AUDIT.md:20`

## Willingness-to-Pay Evidence (from benchmark + market data)

| Source | Claim | Confidence |
|---|---|---|
| **Competitive benchmark Tier D** (Phase 2 §5) | No consumer competitor observed at R19 one-time price with statute-grounded rules; AI Lawyer charges $55/wk (≈R1,000/wk) — 50× price anchor | **[OBSERVED]** |
| **R19 vs. attorney hourly rate** | R1,500/hr anchor; R19 is "vs. a cup of coffee" — positions as accessible triage, not a legal-review substitute | **[OBSERVED, pricing page]** |
| **Free-AI substitution** (Phase 2 §31) | Users will ask ChatGPT/Claude first; ContractCheck's defence is statute grounding, source links, explicit non-advice boundary | **[OBSERVED — category-wide concern]** |
| **Pack pricing rationale** (Phase 1 §82) | R39 (3) / R99 (10) anticipates multi-contract users (job-hunting + renting simultaneously); volume needed for material revenue | **[HYPOTHESIS — no revenue data in-repo]** |
| **Live payment status** | Paystack settlement, webhook/verify edge cases, receipt recovery in production — **never proven end-to-end** | **[OBSERVED gap, BLOCKED]** |

## Free/Traction Claims (none invented)

- **0 GitHub stars**, no traffic/revenue/conversion data in-repo
- **No settled payment** ever tested (audit §Feature inventory: BLOCKED)
- **No SEO evidence** beyond sitemap/robots/canonical
- **No user surveys or interviews** confirming willingness to pay

**Bottom line:** The pricing model is internally consistent (one-time credits, three tiers, Paystack inline) and defensibly positioned against subscription competitors and attorney-rate anchors. **Willingness-to-pay is unproven in production**; the product is not commercially real until a live Paystack transaction completes end-to-end.

## Outstanding for Commercial Validation

- [ ] Live Paystack payment end-to-end (settlement, webhook, receipt recovery, unlock)
- [ ] Real settled payment recorded and instrumented
- [ ] Refund/recovery flow tested with actual payment failure
- [ ] Pricing A/B test or conversion data from a distribution channel