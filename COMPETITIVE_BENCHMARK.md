# ContractCheck — Competitive Benchmark (Phase 2)

**Date:** 2026-11-08 · **Subject:** ContractCheck (ZA/UK consumer contract triage, R19/report) · **Scope:** Contract-intelligence + consumer legal-tech
**Method:** Web research (2025–2026 sources). Pricing/positioning claims are tagged **[OBSERVED — source]** where a cited page stated them, otherwise **[HYPOTHESIS / NOT VERIFIED]** — vendor marketing pages overstate; treat competitor feature lists as claims, not audited facts. ContractCheck facts are **[OBSERVED]** from its repo/live site.

## 1. Competitive tiers (where the market actually sits)

| Tier | Players | User | Price signal **[OBSERVED]** | Overlap with ContractCheck |
|---|---|---|---|---|
| **A. Enterprise contract AI** (law firms / in-house) | Harvey ($11B val. Mar 2026), Legora ($5.6B), Thomson Reuters CoCounsel, Lexis+ Protégé, Spellbook, LegalOn ($550/seat/mo indiv. per GC AI Jun 2026), Luminance (UK), Ironclad ($3.2B), GC AI ($500/seat/mo), LegalFly, Juro, Icertis | Lawyers, GCs, legal ops | Demo-only / $500+/seat/mo; Ironclad/Harvey not public | **Low direct overlap** — same *job* (flag risky clauses) but different buyer, budget, workflow (Word redlines, playbooks, CLM). ContractCheck cannot win here and shouldn't try |
| **B. Contract lifecycle (CLM)** | Ironclad, PandaDoc, DocuSign CLM, Contractbook, Icertis | Ops/procurement teams | Enterprise, sales-led | **None** — ContractCheck is pre-signature consumer triage, not portfolio management |
| **C. Consumer legal-tech / DIY legal** | LegalZoom ($756M rev 2025), Rocket Lawyer ($39.99/mo + Rocket Copilot 2025), AI Lawyer ($55/wk, $159/mo, $759/yr per ailawyer.pro), LegalShield, Lawhive (UK), DoNotPay | Consumers, SMBs | $40–$160/mo subscriptions **[OBSERVED]** | **Medium** — same consumer, but they *create* documents / sell attorney access; ContractCheck *reviews* an existing document. Closest in spirit, far in scope |
| **D. General AI (free baseline)** | ChatGPT, Claude (Claude for Legal launched May 2026), Microsoft Copilot ($18–30/user/mo) | Everyone | Free–$20/mo **[OBSERVED]** | **High as substitute** — users paste contracts into chatbots for free. ContractCheck's defence is structure, SA/UK law grounding, and honesty about limits. Confidentiality risk of chatbots is its wedge |
| **E. Direct consumer contract reviewers** | AI Lawyer (contract review tool), Genie AI (UK commercial), misc per-document AI reviewers | Consumers / SMBs | Mostly subscription or per-doc, **not consistently published — NOT VERIFIED** | **Highest direct overlap** — but none observed combining *ZA-statute-specific rules + plain-language guide + R19 one-time price* |

**Sources:** ailawyer.pro "Top Legal Tech Companies in 2026" (valuations, LegalZoom/Rocket/AI Lawyer pricing); GC AI comparison matrix Jul 2026 (LegalOn $550, GC AI $500, Copilot $21/$30); LegalOn 2026 benchmark; LegalFly/CoCounsel. All vendor-adjacent — cross-check before citing commercially.

## 2. Competitor profiles (leading names)

### Tier A — Enterprise contract intelligence
- **Luminance (UK)** — traffic-light risk analysis, automated negotiation, due-diligence data rooms. Enterprise pricing, demo-only **[OBSERVED — Lumay/ailawyer lists]**. *Lesson for ContractCheck:* the traffic-light visual + clause-level citations are the expected pattern even at consumer level — ContractCheck's gauge + finding cards already match this idiom.
- **Spellbook** — contract review/redlining *inside Microsoft Word*. *Lesson:* in-context review wins for professionals; consumers have no Word workflow — upload-and-report is the right consumer idiom.
- **LegalOn** — attorney-built playbooks, Word add-in, vault; claims 85% faster review. *Lesson:* playbooks = reusable rule packs. ContractCheck's ZA/UK rule packs are the consumer equivalent of playbooks — a defensible asset if curated visibly.
- **Harvey / Legora / CoCounsel** — firm-wide AI platforms, research-grounded. Irrelevant as direct competitors; relevant as *expectation setters* (users now expect AI to cite sources).

### Tier C — Consumer legal-tech
- **LegalZoom / Rocket Lawyer** — document generation + attorney networks, subscription. ContractCheck is cheaper per use but narrower (review-only). A partnership angle (review → attorney referral) exists — ContractCheck already links out to LSSA/Legal Aid SA on High Risk **[OBSERVED]**.
- **AI Lawyer** — AI-native consumer Q&A/docs at $55/week. Price anchor: an order of magnitude above ContractCheck's R19 (~$1) one-time. **This is ContractCheck's core pricing advantage** — if conversion holds.

### Tier D — Free AI baseline (the real competitor)
ChatGPT/Claude with a pasted contract is free, instant, and fluent. It lacks: statute-grounded ZA rules, excerpt-level source linking, coverage disclosure, and "not legal advice" boundaries. **[HYPOTHESIS]** Most lost conversions go here, not to LegalZoom.

## 3. Design & product references (steal these patterns)

1. **Traffic-light / gauge scoring** — Luminance's visual risk language is now the category idiom. ContractCheck's 0–100 gauge + High/Medium severity labels conform **[OBSERVED]**.
2. **Clause-side-by-side** — "original wording beside explanation" (ContractCheck reading guide) matches LegalOn/Spellbook citation patterns; enterprise users are trained to demand it.
3. **Decision brief** — ContractCheck's "Bottom line: sign / negotiate / stop" + priorities is *ahead* of most consumer tools (usually clause dumps). Enterprise tools increasingly add executive summaries — this is a parity-plus feature.
4. **Playbook transparency** — LegalOn markets "attorney-built playbooks." ContractCheck cites statutes per finding (RHA s5(3)(d) etc.) — publish the rule-pack contents/count to borrow this trust signal.
5. **Free-tier as sample** — ContractCheck's 3 full demo reports + downloadable samples are stronger than typical "book a demo" funnels. Keep.

## 4. Feature comparison matrix

| Capability | ContractCheck | Tier A (Luminance/LegalOn) | Tier C (LegalZoom/Rocket/AI Lawyer) | Free AI chat |
|---|---|---|---|---|
| Consumer self-serve, no sales call | ✅ | ❌ demo-only | ✅ subscription | ✅ |
| One-time per-document price | ✅ R19 | ❌ $500+/seat/mo | ❌ $40–160/mo | ✅ free |
| SA-statute rules (RHA/CPA/BCEA/POPIA) | ✅ | ❌ US/UK/global playbooks | ❌ generic | ❌ generic |
| UK rules | ⚠️ thin | ✅ (Luminance UK-native) | ⚠️ via attorney | ⚠️ generic |
| Source-linked excerpts | ✅ | ✅ | ⚠️ varies | ❌ unreliable |
| Plain-language guide (≤400 sections) | ✅ | ❌ (professional register) | ⚠️ | ⚠️ fluent but ungrounded |
| Redlining / draft replacement | ❌ (explicitly excluded) | ✅ | ✅ (drafting) | ⚠️ (low quality) |
| Attorney referral / human review | ⚠️ outbound links only | n/a | ✅ bundled | ❌ |
| PDF export + checklists | ✅ | ✅ | ⚠️ | ❌ |
| Privacy: 48h expiry, originals deleted | ✅ | ❌ (retained vault) | ⚠️ | ⚠️ (training opt-outs) |

## 5. Differentiation assessment

**Genuine differentiators [OBSERVED]:**
1. **Price architecture** — R19 one-time vs. subscriptions 20–100× higher per month. No consumer competitor observed at this price point with statute-grounded rules.
2. **Jurisdiction specificity** — ZA consumer law (Rental Housing Act, CPA, BCEA, POPIA, NCA) is a niche global incumbents ignore. This is the moat.
3. **Deterministic + honest** — rules engine with versioned rules, coverage disclosure, "AI-suggested" labelling, explicit non-advice boundary. Enterprise AI hype has created a trust vacuum this fills.
4. **No drafting** — deliberately refusing to draft clauses avoids unauthorised-practice risk that drafting tools carry. A regulatory moat as much as a product choice.

**Not differentiators (parity or weaker):** scoring gauge (category standard), PDF export, OCR of scanned docs, UK support (thin vs. Luminance/Genie), AI enrichment (optional and capped — competitors offer deeper LLM review).

## 6. Opportunity map

| # | Opportunity | Rationale | Effort | Evidence level |
|---|---|---|---|---|
| O1 | **Publish the rule packs** — "12 ZA rules, 4 UK rules, version 4.1.2" page + per-finding statute links | Borrows LegalOn playbook trust; SEO for "lease deposit South Africa law" etc. | Low | **[HYPOTHESIS — high confidence]** — enterprise category proves users value this |
| O2 | **Close the free-AI gap** — "Why not just ask ChatGPT?" FAQ: confidentiality, statute grounding, source links | Tier D is the true substitute | Low (copy) | **[OBSERVED]** — chatbot confidentiality concerns are documented category-wide |
| O3 | **Lease/employment landing pages** per contract type + jurisdiction (SEO) | Long-tail "is this lease clause legal South Africa" demand | Medium | **[HYPOTHESIS]** — no traffic data in-repo; validate with search volume |
| O4 | **Attorney handoff** — paid "lawyer review" add-on or referral rev-share (Lawhive model) | Monetises High-Risk users; LSSA/Legal Aid links already exist | Medium-High | **[HYPOTHESIS]** — needs partner validation |
| O5 | **Extend retention** — 48h → 30 days for paid reports (or "keep forever" PDF vault) | Real signing timelines exceed 48h | Low | **[HYPOTHESIS]** — support-ticket validation needed |
| O6 | **B2B2C channels** — tenant unions, HR onboarding, fintech (deposit/credit moments) | Solves distribution (0-star problem) | High | **[HYPOTHESIS]** |
| O7 | **Deeper UK rules** or position UK as "beta" | Currently one demo vs. ZA depth; UK incumbents (Luminance) are strong | Medium | **[OBSERVED gap]** |

## 7. Threats

1. **Free AI quality** — Claude for Legal (May 2026) signals LLM providers moving down-market. Source-citation quality is the battleground.
2. **Consumer legal-tech bundling** — Rocket Copilot + attorney access could absorb the "review" job into a subscription users already pay.
3. **Regulatory** — SA legal-practice rules on AI advice; ContractCheck's restraint is protective but limits upsell.
4. **Price ceiling** — R19 signals "cheap" to some; enterprise anchors ($500/seat) make even R99/10 feel premium — positioning copy should lean *into* the anchor ("vs. R1,500/hr attorney").

## 8. Verdict

ContractCheck occupies a **real, empty quadrant**: *consumer × jurisdiction-specific × one-time-price × rules-grounded*. Enterprise contract AI (Tier A) validates the job; consumer legal-tech (Tier C) validates willingness to pay for legal help but at subscription prices 20–100× higher; free AI (Tier D) is the substitute to beat on trust and grounding, not features. The defensible path is **depth in ZA consumer law + radical price/transparency honesty**, not feature parity with Luminance or Harvey.

**Top 3 moves:** (1) prove live payment end-to-end (the product is not commercially real until then); (2) publish rule-pack transparency (O1) + anti-ChatGPT FAQ (O2) for trust/SEO; (3) pick a distribution channel (O3 or O6) — the product's only observed weakness is that nobody knows it exists.
