# ContractCheck — Product Identity (Phase 1)

**Date:** 2026-11-08 · **Repo:** https://github.com/buttercode101/ContractCheq (`main`, 213 commits, 0★/0 forks observed 2026-11-07) · **Live:** https://contractcheck.online · **Version observed:** 3.1.2 (`/api/health` per prior audit; `RULES_VERSION=4.1.2-sa-2026` in `server/riskEngine.js`)
**Method:** Repo + live-site inspection. Every claim below is tagged **[OBSERVED]** (directly seen in code/site/audit docs) or **[HYPOTHESIS]** (inference needing validation). Do not treat hypotheses as facts.

## 1. One-line product

> **[OBSERVED]** "Understand the wording. Spot risks. Ask better questions before you sign." — `README.md:6`. Live headline: "Read the risks. Before you sign." (`public/index.html`, live site).

## 2. Problem

**[OBSERVED]** Consumers signing leases, employment agreements and service contracts cannot readily parse legal wording, spot unfair/risky clauses, or know what to ask before signing. README frames it as: people "make sense of a document before committing to it" (`README.md:8`). Site footer/FAQ disclaimers repeat the boundary: "Automated contract triage, not legal advice" (live site, pricing FAQ).

**[HYPOTHESIS]** The underlying pain is information asymmetry + low legal literacy + cost/time of a lawyer for a routine consumer contract. This is plausible and matches the target situations table (renting, job offer, freelance quote) but no user interviews / survey evidence exists in-repo to confirm frequency or severity. Needs validation before use in marketing copy.

## 3. Target user (primary + secondary)

**[OBSERVED]** Primary: South African and UK consumers reviewing *personal* contracts — tenants, employees, freelancers/service providers (README situation table; `perspective` selector: tenant/landlord/employee/employer/freelancer/client in `index.html:532`). Jurisdiction switch is hard-coded to **ZA / UK only** (live site). No enterprise/team/accounts feature observed.

**[OBSERVED]** Explicit non-user boundary: not a law firm, not for legal advice, does not draft clauses (Terms, `index.html:625-638`).

**[HYPOTHESIS]** Secondary users (landlords, employers, clients) are included as perspective tailoring, but the copy, pricing (R19 ZAR), and SA law references (RHA, CPA, BCEA, POPIA, NCA) strongly suggest the *intended* paying user is the weaker party — tenant/employee/freelancer in ZA first, UK second. UK support appears newer/narrower (one demo: UK tenancy).

## 4. Value proposition

**[OBSERVED]** "A clearer picture of your lease, job offer, or agreement" (live hero) delivered as:
1. Free risk score (0–100 gauge) + first 3 flagged issues (live site: "Free score + 3 flags").
2. Paid: plain-language reading guide (source-linked, ≤400 sections), every flagged issue with analysis/recommendation/impact/law reference, payment/obligation summaries, role-specific questions, PDF export, device-only checklists + calendar export (status: paid features server-withheld from free preview — README + `index.html:561,565`).

**[OBSERVED]** Differentiating mechanics vs. generic AI chat: rules engine is deterministic regex/pattern based (`riskEngine.js`, 543 lines), every finding carries `excerpt + analysis + rec + impact + lawRef` and a rules version; plain-language guide keeps original wording beside explanation and discloses coverage (`included/total sections`, `needsReview` counts).

**[HYPOTHESIS]** The perceived value is *confidence to sign / negotiate / walk away*, not the score itself. The "Bottom line" decision brief (sign/negotiate/stop framing) is the conversion surface. Unvalidated — no analytics data in-repo beyond `track()` events.

## 5. User journey (observed)

| Step | What happens | Evidence |
|---|---|---|
| 1. Land | Hero: "Read the risks. Before you sign." + upload panel + 3 example reports + pricing strip | live site |
| 2. Choose jurisdiction | ZA / UK toggle; optional role selector (does not change score) | `index.html:523-533` |
| 3. Upload | PDF / image / TXT, ≤4 MB prod (12 MB local), drag-drop or paste text; OCR via tesseract.js / pdf-parse+canvas | README, `PRODUCTION_READINESS_AUDIT.md:12` |
| 4. Free preview | Score gauge, risk level, issues count, first 3 analyses; rest locked | `index.html:561,566` |
| 5. Consider examples first | 3 full demo reports (SA lease, SA employment, UK tenancy) + downloadable samples — *no signup gate* | `index.html:538-540` |
| 6. Pay | Paystack inline checkout, ZAR: R19×1 / R39×3 / R99×10 credits; email receipt; idempotent unlock; receipt recovery via reference+email | README:33, `index.html:331-396,584-589` |
| 7. Read full report | Overview → Payments & actions → Checklist & dates → Reading guide → Findings → Notes; attorney-referral card on High Risk (LSSA / Legal Aid SA / Law Society / Citizens Advice) | `index.html:544-578` |
| 8. Act / keep | Export PDF (jsPDF), save editable checklist locally (`cc_checklists_v1`), confirm dates → `.ics` export (manual only), private notes per report (localStorage `cc_v3`) | `index.html:420-499`, TECHNICAL-NOTES |
| 9. Return | "Reopen last unlocked report" / restore receipt — reports retained 48 h, then daily cleanup | `index.html:261-263` |

**[OBSERVED]** Friction design: no account, no email required for free scan; email only at Paystack checkout. Retention is browser-local (notes/credits/unlocked in `cc_v3`) + server 48 h report store (Supabase/Vercel Blob, private).

## 6. Scope: IN / OUT (observed)

**IN (v3.1.2):**
- Contract types: residential lease, employment, service/freelance, general — via rule tags, not a type picker **[OBSERVED]** (`riskEngine.js` tags: RHA, CPA, BCEA, POPIA, NCA, LRA…).
- Jurisdictions: ZA (deep: RHA/CPA/BCEA/POPIA/NCA/LRA) + UK (tenancy/deposit/liability rules) **[OBSERVED]**.
- Inputs: PDF (vector + OCR), photos (PNG/JPG/etc. OCR), TXT, pasted text **[OBSERVED]**.
- Outputs: score/level/decision brief, flagged issues, plain-language guide, payment summaries, obligations, dates-in-context, questions, checklists, PDF/ICS export **[OBSERVED]**.
- Optional AI enrichment (OpenRouter default `deepseek/deepseek-v4-flash`, Groq fallback off by default, ≤4,000 chars, consent-gated, labelled "AI-suggested") — core works without it **[OBSERVED]** (TECHNICAL-NOTES, `index.html:534`).
- Freemium monetisation via Paystack credits **[OBSERVED]**.

**OUT (explicitly excluded in product copy):**
- Legal advice, enforceability decisions, clause drafting/rewriting, complete legal review **[OBSERVED]** (Terms, README:29).
- Missing attachments / unreadable text explanation; >400-section guide truncation (disclosed) **[OBSERVED]**.
- Deadline calculation (calendar export requires manual user-confirmed dates) **[OBSERVED]**.
- Account system, cross-device sync, subscriptions, team CLM, e-signature, document drafting **[OBSERVED]** (absent in code; pricing is one-time only).

## 7. Maturity assessment (evidence-based)

| Dimension | Rating | Evidence |
|---|---|---|
| Engineering | **Mature for solo/ indie stage** | 134/134 tests pass, smoke OK, 0 high vulns (`npm audit`), CI + branch protection, CSP/HSTS, privacy-by-design (48 h expiry, originals deleted) — `PRODUCTION_READINESS_AUDIT.md`, PROGRAMME_TRACKER |
| Product completeness | **Feature-complete v1** | End-to-end upload→preview→pay→report→export→recover loop works (simulated payments); 3 demo reports; receipt recovery; offline/storage-outage UX **[OBSERVED]** |
| Commercial validation | **Unproven** | No real settled payment ever tested ("BLOCKED" — audit §Feature inventory); 0 GitHub stars; no traffic/revenue/conversion data in-repo. LIVE payment is the #1 unknown |
| Legal accuracy | **Triage-grade, not authoritative** | Regex rules with statute citations (e.g. RHA s5(3)(d)); false-negative risk acknowledged everywhere; no lawyer review attestation in-repo **[OBSERVED]** |
| AI layer | **Optional, guarded** | Off by default, excerpt-limited, zero-retention provider requirement, labelled output |
| UX/design | **Polished v1** | DM Sans + Instrument Serif, risk gauge, source-linked cards, mobile-responsive, a11y focus-traps, reduced-motion support (`app.css`) — prior UI audit 12/15 |
| Overall score (prior audit) | **81/100 CONDITIONAL** | `PRODUCTION_READINESS_AUDIT.md:45` — conditioned on live payment + physical device |

## 8. Business model (observed)

One-time credits, ZAR via Paystack: **R19 (1) / R39 (3, R13 ea) / R99 (10, R9.90 ea)**. Free tier: score + 3 flags. No subscription. Receipt = bearer credential (reference + email). Refunds case-by-case on unlock failure (contact: buttercode101@gmail.com). Cost structure exposure: Vercel + Supabase + Blob + optional OpenRouter (price-capped).

**[HYPOTHESIS]** At R19/report, the product needs volume or a B2B2C channel (e.g. linking to legal-aid/tenant orgs) to be material; the pack pricing already anticipates multi-contract users (job-hunting + renting simultaneously).

## 9. Key risks & open questions

1. **Live payment never proven** — Paystack settlement, webhook/verify edge cases, receipt recovery in production. **[OBSERVED gap]**
2. **Rule coverage vs. AI hype gap** — regex will miss novel/unfair clauses; competitors with LLMs may feel smarter. Trust hinges on "source-linked" honesty. **[OBSERVED limitation]**
3. **Retention window** (48 h) vs. real decision timelines (lease signing often days later) — PDF export mitigates, but awareness is low. **[HYPOTHESIS]**
4. **No distribution signal** — 0 stars, no SEO evidence beyond sitemap/robots/canonical. **[OBSERVED]**
5. **UK depth** — single demo, thinner rule set than ZA; expansion claim is ahead of evidence. **[OBSERVED]**

## 10. Evidence index

Repo files: `README.md`, `public/index.html` (669 lines, full SPA), `server/riskEngine.js` (543), `server/plainLanguage.js` (159), `server/actionPlan.js`, `server/reportContext.js`, `docs/TECHNICAL-NOTES.md`, `PRODUCTION_READINESS_AUDIT.md`, `PROGRAMME_TRACKER.md`. Live: contractcheck.online (hero, jurisdiction switch, demos, pricing, FAQ) inspected 2026-11-07.
