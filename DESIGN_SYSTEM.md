# ContractCheck — Design System (Phase 4)

**Date:** 2026-11-08 · **Status:** Proposed system, grounded in observed v3.1.2 implementation
**Sources read first:** `PRODUCT_IDENTITY.md` (Phase 1), `COMPETITIVE_BENCHMARK.md` (Phase 2), `UX_AUDIT.md` (Phase 3), plus direct inspection of `public/app.css` (253 lines) and `public/index.html` (669 lines) and `server/riskEngine.js`.
**Tagging:** **[OBSERVED]** = seen in code/live/docs. **[PROPOSED]** = this document's design decision, not yet implemented. **[NOT VERIFIED]** = needs measurement/testing before any public claim.
**Identity guardrail:** This system extends the existing ContractCheck visual identity (forest-green ink/accent, warm paper, DM Sans + Instrument Serif). It does not adopt any competitor's visual identity — competitor references are limited to interaction *patterns* (traffic-light scoring, clause-side-by-side, decision brief); see §10.

---

## 1. Design intent & interaction principles

ContractCheck sells *confidence to sign / negotiate / walk away* (PRODUCT_IDENTITY §4, **[HYPOTHESIS]** on perceived value — do not print as fact). Every pattern below serves that job: legible, honest about limits, and never anxiety-inducing.

| # | Principle | Rule | Anti-pattern (observed defect behind it) |
|---|---|---|---|
| P1 | **Show the source beside the claim** | Every flag, amount, and guide section keeps its excerpt visible or one tap away. | Locked cards leaking excerpt + law title without analysis (UX-09). |
| P2 | **Honesty over persuasion** | Disclose coverage, limits, expiry, and uncertainty at the decision moment, not in fine print. | 48 h retention invisible at paywall/checkout (UX-10/06). |
| P3 | **One clear next step** | Each view has one primary action; secondary actions are visually quieter. | Five pre-upload decisions before any value (UX Audit §2). |
| P4 | **Never lose the user's work** | Refresh, back, tab-close, and payment-close must never destroy a scan, credit, or reference. | State-only result view — refresh = landing (UX-01). |
| P5 | **Confirm irreversible spend** | Credits and money are spent only after an explicit, sized confirmation. | One-tap credit spend, no balance shown (UX-05). |
| P6 | **Calm, low-stimulation motion** | Motion orients and confirms; it never decorates or rushes. Fully off under reduced-motion. | Scroll-behaviour + hover lifts exist today with no reduced-motion audit beyond a kill-switch (see §8). |
| P7 | **Text never shrinks to fit** | Information is wrapped/reflowed, never removed to save width. | ≤359 px CSS hides finding-number / rule-label / country-code (UX Audit §5). |
| P8 | **Errors live where the action happened** | Inline, scoped, recoverable. Global banners are last resort, queued, never overwriting. | Single-slot top banner overwriting prior errors (UX-13). |

---

## 2. Typography

**[OBSERVED]** Current stack: `DM Sans` (sans, UI + body) and `Instrument Serif` (`.serif`, display accents) via Google Fonts; system-ui fallback. Accent flourishes in the serif are part of the identity — keep.

### 2.1 Scale (proposed, 1.25 ratio, rem-based so user font-size/zoom scales it)

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--text-display` | `clamp(2.625rem, 5vw, 4.25rem)` / 1.04, letter-spacing −0.03em | 500 | Landing hero (observed 48–68 px after audit fixes) |
| `--text-h1` | `clamp(2rem, 4vw, 3rem)` / 1.15 | 500 | Page intros, report title (28–32 px observed; keep ≤32 in report) |
| `--text-h2` | 1.375–1.625rem / 1.3, −0.02em | 500–600 | Section headings |
| `--text-h3` | 1.1875rem / 1.4 | 600 | Card / finding titles |
| `--text-body` | 1rem (16 px) / 1.65 | 400 | Default reading text — **floor, never below 16 px for body** |
| `--text-body-sm` | 0.875rem (14 px) / 1.6 | 400 | Supporting copy, card bodies |
| `--text-caption` | 0.8125rem (13 px) / 1.6 | 400–500 | Captions, metadata, hints |
| `--text-eyebrow` | 0.75rem (12 px) / 1.6, +0.08em, uppercase | 600 | Eyebrows, content labels — **minimum size anywhere in the product** |

Rules:
- **Hard floor: 12 px** for any rendered text. The observed 9–11 px labels at ≤359 px (UX-15) are deprecated; wrap or stack instead of shrinking.
- Long-form reading (findings, guide clauses) stays at 16 px / 1.65 — observed as the audit's reading-hierarchy fix; do not regress.
- Serif is reserved for hero/display accents and the `.serif` class only; never for body, labels, or numbers (numerals use `font-variant-numeric: tabular-nums` in metrics/gauge).
- `text-wrap: balance` on h1–h3 **[OBSERVED]** — keep.
- Body copy max measure ~65–75 ch in guide/findings; report column is capped at 940–1000 px **[OBSERVED]**.

---

## 3. Colour

**[OBSERVED]** Current palette (`app.css :root`): `--ink:#19352e`, `--accent:#176852`, `--muted:#5f706a`, `--line:#dfe6de`, `--paper:#f7f8f4`, `--surface:#fff`, `--soft:#edf2eb`, `--red:#a33730`. Gauge colours in `index.html:89`: High `#cb3e36`, Medium `#a96813`, Low `#166653`. Finding left-bars: amber `#c78325` (medium), red `#c95749` (high).

### 3.1 Semantic tokens (proposed — same hues, formalised roles)

| Token | Value | Role | Notes |
|---|---|---|---|
| `--color-ink` | `#19352e` | Primary text, headings, header | |
| `--color-accent` | `#176852` | Primary actions, links, focus-adjacent UI | Hover `#115640` **[OBSERVED]** |
| `--color-accent-strong` | `#0f624d` | Text on light fills where contrast is tight | **[PROPOSED]** audit-grade darkening for small text; verify §9 |
| `--color-muted` | `#5f706a` | Secondary text | Body-secondary only; never essential info at <14 px |
| `--color-paper` | `#f7f8f4` | Page background | |
| `--color-surface` | `#ffffff` | Cards, panels, modals | |
| `--color-soft` | `#edf2eb` | Tinted fills, selected states | |
| `--color-line` | `#dfe6de` | Borders, dividers | |
| `--color-risk-low` | `#166653` | Low band, gauge, status | **Engine threshold: score < 40** [OBSERVED, `riskEngine.js:503-505`] |
| `--color-risk-medium` | `#a96813` | Medium band, gauge, status | **40–69** [OBSERVED] |
| `--color-risk-high` | `#cb3e36` | High band, gauge, status | **≥ 70** [OBSERVED] |
| `--color-warning-bg` / `--color-warning-ink` | `#fdf6e3` / `#926016` | Caution (extraction warnings) | Warning ink **[OBSERVED]** in `.extraction-warning` |
| `--color-error` | `#a33730` | Destructive/error text & borders | Do not reuse for "high risk" — risk ≠ error |
| `--color-focus` | `#83b5a1` | Focus outline (3 px, offset 4 px) | **[OBSERVED]** — keep; pairs with ink for visibility |

Rules:
- **Risk colour is never the only signal.** Every band also carries a text label ("Low/Medium/High Risk") — colour-blind users get the word, not just the hue. (Category pattern from Luminance-style traffic-lights, adopted as *pattern*, not identity.)
- Error red and high-risk red are intentionally different hues/roles; never place them adjacently without labels.
- No new brand hues without a contrast check (§9). Dark surfaces: only the price-strip treatment **[OBSERVED]** (ink background, paper text) — no dark mode is proposed or claimed.

---

## 4. Spacing, radius, elevation

**[OBSERVED]** 4 px-based ad hoc spacing throughout; `--radius:20px` legacy token; actual surfaces use 8/10/12/16/18/20/24 px radii inconsistently (cards 12–20 px, buttons 8–12 px). Shadows were mostly removed by the reading-hierarchy pass.

### 4.1 Spacing scale (proposed — formalise what exists)

`--space-1:4px · --space-2:8px · --space-3:12px · --space-4:16px · --space-5:20px · --space-6:24px · --space-8:32px · --space-10:40px · --space-12:48px · --space-16:64px`

- Section vertical rhythm: 48 px desktop / 32 px mobile (observed `--space-section:48px`).
- Card internal padding: 24 px desktop / 20 px mobile (observed pattern).
- Gaps in grids: 12–16 px card grids, 24–40 px feature grids.
- Touch targets: **minimum 44×44 px** for all interactive elements **[OBSERVED as audit fix]**; primary CTAs 48 px min-height.

### 4.2 Radius & elevation (proposed ratification)

- Radius scale: `--radius-sm:8px` (buttons, inputs), `--radius-md:12px` (cards, panels), `--radius-lg:16px` (large panels), `--radius-xl:20px` (hero-adjacent surfaces only). Deprecate one-off 18/22/24/26 px.
- Elevation: flat by default (1 px `--color-line` border). Shadow reserved for: sticky header (none — border only **[OBSERVED]**), modal (single `--shadow-modal`), and the upload panel at rest. No hover-lift on cards/buttons (the audit pass removed `transform` hovers — keep them removed; they fight P6).

---

## 5. Layout & breakpoints (320–1440)

**[OBSERVED]** Breakpoints today: 1600, 1199, 1100, 900, 700, 640, 480, 380, 359 px; content max 1240 px shell / 940–1000 px report; safe-area insets and `100dvh` modal handling present.

### 5.1 Proposed breakpoint system (consolidated — behaviour, not device names)

| Token | Range | Layout behaviour |
|---|---|---|
| `--bp-sm` | 320–639 px | Single column. Hero copy above upload panel — **[PROPOSED]** move upload panel's first field (jurisdiction) or a "Try a sample" link into the first 2 screens; tap targets full-width where observed (upload label 100%). Report summary: title full-width, metrics stacked, gauge 112 px beside metrics **[OBSERVED]**. No information hidden (P7). |
| `--bp-md` | 640–899 px | Single column, max 660 px reading width. Examples/pricing stack 1-up → 2-up. |
| `--bp-lg` | 900–1199 px | Two-column hero (observed 1fr/1fr at 901–1199); pricing 2×2; report summary 2-col with gauge. |
| `--bp-xl` | 1200–1439 px | Full shell (1240 px + gutters). Hero 1.1fr/1fr, examples 3-up, pricing 4-up. |
| `--bp-2xl` | ≥1440 px | Shell capped at 1240 px, centred; hero type may grow to 102 px **[OBSERVED]** at ≥1600 — cap at 84 px to avoid runaway measure; extra width goes to gutters, never to longer lines. |

Rules:
- **320 px is a first-class width**, not an afterthought: no horizontal scroll, no clipped labels, 12 px text floor (§2). The observed ≤359 px information-hiding is removed.
- Reference patterns only: stacking → grid promotion matches standard responsive practice; no competitor layout is copied.
- `env(safe-area-inset-*)` padding on shell/header **[OBSERVED]** — keep for notched devices.
- 200% zoom / 320 px reflow target: content must remain usable with no 2D scrolling — **[NOT VERIFIED]** on device today (UX Audit §8), required before any "mobile-verified" claim.

---

## 6. Components

Each component: **variants · states · a11y contract**. "Observed" marks what exists today; "Proposed" marks the change.

### 6.1 Buttons
- **Primary** (accent fill, white text, 48 px) / **Secondary** (surface, line border) / **Text** (accent, underline offset) — **[OBSERVED]**, keep.
- States: default, hover (darken, no lift), `focus-visible` (3 px `#83b5a1` outline, 4 px offset), disabled (opacity .55 + `cursor:wait` **[OBSERVED]** — **[PROPOSED]** also set `aria-disabled` semantics; disabled must never be the only way to learn why — always pair with a reason line, as checkout does today).
- Busy state: label swaps to verb + ellipsis ("Unlocking…", "Verifying receipt…") **[OBSERVED]** — extend to demo cards (UX-07) and Paystack handoff.

### 6.2 Upload panel / drop zone
- **[OBSERVED]** Dashed drop area, drag state (green fill), hidden file input in `<label>`, client size/type pre-check.
- **[PROPOSED]** File-selected chip (UX-11): `filename · size · Remove / Choose different`; paste-text toggle (UX-04) with char counter (server ≥30, ≤200k chars **[OBSERVED]**); offline disables upload with reason (UX-14).
- States: idle, dragging, selected, invalid-type, too-large, offline, storage-unavailable — each with icon + text, never colour alone.

### 6.3 Segmented control (jurisdiction) & selects (role)
- **[OBSERVED]** `aria-pressed` segmented control; role `<select>` with "does not change the score" hint.
- **[PROPOSED]** AI opt-in: headline + "What does AI see?" `<details>` (UX-16) replacing the single long disclosure sentence.

### 6.4 Score gauge
- **[OBSERVED]** SVG ring, 0–100, band colour, `aria-label="N out of 100, Level"`.
- **[PROPOSED — fixes UX-15]:** `role="img"` (or `role="meter"` with `aria-valuenow/min/max`) + visible band label + "How the score works" expander (§6.9). Spinner gets `aria-valuetext` stage text; no fake progress %.

### 6.5 Finding card
- **[OBSERVED]** Numbered header, severity label, risk chip, excerpt blockquote, analysis, recommendation, impact, law reference.
- **[PROPOSED — fixes UX-09]:** locked state shows **title + severity + one-line "why it matters"** and hides the excerpt; or hides excerpt entirely. Never excerpt-without-meaning.
- Left-bar colour (amber/red) always paired with severity text.

### 6.6 Decision brief ("Bottom line")
- **[OBSERVED]** Sign / negotiate / stop + priorities + money + confidence. Keep as the conversion surface (Phase 2 §3 — parity-plus vs. clause-dump competitors).
- **[PROPOSED]** Each priority row links to its finding anchor; confidence line states rules version + jurisdiction pack (e.g. "ZA rules v4.1.2").

### 6.7 Banners: notice / error / unlock / recovery
- **[PROPOSED — fixes UX-13]:** notice queue (max 2 visible, auto-expire 8 s except payment/recovery notices which are sticky); errors scoped to the initiating panel; global banner only for cross-cutting failures (offline, storage). Every banner: icon + heading + body + action + 44 px dismiss.
- Unlock banner **[OBSERVED]** — add 48 h line + credit balance (UX-05/10), see §7.4.

### 6.8 Modal (checkout) & Paystack handoff
- **[OBSERVED]** Focus trap, Esc, backdrop-close, focus restore, `inert` shell.
- **[PROPOSED]** Always-on summary (UX-06): document title, report ID, price, credit effect, 48 h retention, "download PDF to keep". Same modal whether or not email is pre-saved — no silent skip (`startPay` branch removed).

### 6.9 "How the score works" (new, fixes UX-08)
- `<details>` under the gauge: band table (§7.4), rule-pack counts per jurisdiction, rules version, coverage line ("X of Y sections read"), and the one-line caveat already observed ("higher = more risk; not a legal conclusion"). Borrow the *playbook-transparency pattern* (LegalOn-style "attorney-built playbooks") as **published counts + version**, not as copied design.

### 6.10 Navigation, footer, misc
- Sticky header, `aria-current` on active nav, credits badge **[OBSERVED]** — **[PROPOSED]** badge also appears on unlock buttons and confirm sheet.
- Guide search: add "Clear search" button + suggested terms on zero results (UX Audit §3).

---

## 7. Concrete proposals — top UX defects

### 7.1 Routable preview (UX-01, S1) — *[PROPOSED]*

**Problem [OBSERVED]:** Result is state-only; `viewForPath` maps only faq/privacy/terms/contact/pricing/checklists; refresh or back = landing, result nulled.

**Design:**
1. **Addressable result URL:** `#/report/<id>` (hash routing matches the existing SPA; no server change). On load, if `<id>` resolves in the 48 h server store or `cc_v3`, render the result view directly; show "Resuming your scan…" busy state.
2. **Persistence fallback:** store the last free scan preview (score, level, first 3 findings, timestamp) in `cc_v3`; landing shows a **"Resume your last scan"** card when present (mirrors the existing "Reopen last unlocked report" shortcut pattern).
3. **Guard, don't ambush:** starting a new scan while an unsaved preview exists shows an inline confirm ("Start a new scan? Your last preview stays saved under Resume.") — never silent `go('landing')` clearing.
4. **States:** resuming / expired (>48 h — "This preview expired. Scan again or restore a receipt") / not-found (404-style, links to upload + restore).
5. **A11y:** on route change, move focus to the result heading (`tabindex=-1`); `aria-current` updates; history back returns to the exact report view.

**Acceptance:** refresh mid-preview → same view; back → preview; close/reopen tab within 48 h → Resume card present.

### 7.2 Cancel during scan (UX-02, S1) — *[PROPOSED]*

**Problem [OBSERVED]:** 75 s client abort, no UI; `cancelReportRequest()` exists but is unwired; "Keep this page open" copy.

**Design:**
1. **Cancel button** inside the scan-status panel (secondary style, 48 px), wired to `cancelReportRequest()`; same pattern for demo load and unlock/reopen calls.
2. **Honest stages:** replace 2 messages with the real pipeline stages — "Reading document… → Extracting text (OCR if scanned)… → Checking rules (ZA/UK pack)… → Building your preview…" — stage text only, no fabricated % or ETA. `role="status"` + `aria-live="polite"` **[OBSERVED]**; add `aria-valuetext` on the spinner region.
3. **After cancel:** panel returns to idle with notice "Scan cancelled — nothing was charged or saved." Upload controls re-enabled; focus returns to the upload label.
4. **Reduced-motion:** spinner becomes static icon + stage text (§8); no rotation.

**Acceptance:** cancel at any stage aborts the fetch; no orphan result; screen reader announces cancellation.

### 7.3 Paystack recovery (UX-03, S1) — *[PROPOSED]*

**Problem [OBSERVED]:** `onClose` only fires `track('pay_close')`; no pending state; user must self-navigate to Pricing → Restore. Live payment **[NOT VERIFIED]** — this seam is unproven in production.

**Design:**
1. **On Paystack close with a `pendingReceipt`:** show a dedicated **recovery panel** (not a generic notice): "Did you finish paying? If you paid, don't pay again." + [Restore with reference + email] (deep-links to Pricing restore, prefilled reference) + [I didn't pay — try again] + reference shown in mono with copy button.
2. **On mount:** if `pendingReceipt` exists and no unlock followed, surface a persistent recovery strip on Landing (fixes UX-17 discoverability) until resolved/expired.
3. **Verify-failure path [OBSERVED strength, keep]:** reference preserved, "do not pay again" copy — move that copy *into* the recovery panel so the two paths share one mental model.
4. **Success:** credits-added notice names the action ("1 credit added — 2 remaining") and offers "Unlock this report" inline if the originating report is still open (fixes the cross-view "hunt for the shortcut" dead-end, UX Audit §1 #10).
5. **No silent states:** every close/verify outcome lands in exactly one of: unlocked / recovery panel / error-with-reference. Silence is a defect.

**Acceptance:** close mid-checkout → recovery panel; reload with pending receipt → recovery strip; successful verify → inline unlock offer. **[NOT VERIFIED until one real payment runs end-to-end — Phase 3 P0 #1.]**

### 7.4 Score bands (UX-08, S2) — *[PROPOSED, thresholds OBSERVED]*

**Thresholds [OBSERVED, `server/riskEngine.js:503-505`]:** score < 40 = Low Risk · 40–69 = Medium Risk · ≥ 70 = High Risk. Gauge colours match (§3). Per-rule scores are observed (42–88 range in the rule table) — the aggregate formula (`avg*0.7 + found*8`, capped 0–95) is observed in code but is **not** a user-facing claim; do not summarise it as methodology without eng. sign-off.

**Design:**
1. **Band table in "How the score works"** (§6.9):

   | Score | Band | Plain meaning | Suggested next step |
   |---|---|---|---|
   | 0–39 | **Low Risk** | No major red flags under this ruleset | Read the key commercial terms; ask the listed questions |
   | 40–69 | **Medium Risk** | Flagged items worth negotiating | Negotiate the flagged items before signing |
   | 70–100 | **High Risk** | Serious flags present | Do not sign unchanged; get a second opinion (existing attorney card) |

   Next-step copy reuses the engine's own `decision` strings **[OBSERVED, `:512`]** — no invented advice.
2. **Gauge ticks:** three arc segments in band colours with the band label directly under the number (existing `<b>` level text) — colour + word, never colour alone.
3. **What moves the score:** "Each flag adds weight by severity; the pack version and rule count are published here: ZA `N` rules · UK `N` rules · v4.1.2." — counts must be read from the live rule pack at build time; **do not hard-code counts in copy** (Phase 2 O1 — publish from source).
4. **Anti-misreading line** (always visible, next to band): "A low score is not a legal clearance." **[OBSERVED, `:516-517`]**

**Acceptance:** a first-time user can state what 62 means and what to do next; no band boundary is described that the engine doesn't implement.

---

## 8. Motion & reduced-motion

**[OBSERVED]** Transitions 0.16–0.18 s on buttons/cards; `scroll-behavior:smooth`; spinner `1s rotate`; a `prefers-reduced-motion` kill-switch exists in `app.css` (prior UI audit). Hover lifts were removed by the reading-hierarchy pass.

**Proposed motion budget:**
- Micro (hover/focus colour): ≤160 ms, colour/border only — no transform.
- Panel/modal enter: ≤200 ms fade + 4 px translate; exit ≤150 ms.
- Spinner: 1 s rotate; under reduced-motion → static icon, stage text only.
- `scroll-behavior:smooth` → `auto` under reduced-motion; smooth-scroll only for in-page anchors (report section nav), never on route change.
- **Reduced-motion contract (WCAG 2.3.3 target):** with `prefers-reduced-motion: reduce`, all animation/transition durations → 0.01 ms, parallax/autoplay (none exists — keep it that way), spinner static, gauge animates by instant set. Never gate content on animation completion.
- No autoplay, no infinite decorative motion anywhere.

---

## 9. Accessibility — WCAG 2.2 AA targets

**[OBSERVED]** Foundation is good: skip link, focus-visible 3 px outline, focus trap/restore/`inert` modal, `aria-pressed`/`aria-current`, live regions, 44 px targets, semantic `<details>`, reduced-motion kill-switch. **Gaps [OBSERVED/NOT VERIFIED]:** gauge without proper role; no `forced-colors`/`prefers-contrast`; 9–11 px text at small widths; contrast ratios not measured; 200% zoom unverified.

| Target | Criterion | Requirement |
|---|---|---|
| Text contrast | 1.4.3 AA | ≥4.5:1 body, ≥3:1 large text/UI boundaries — **measure every token pair in §3 before shipping; `--color-muted` `#5f706a` on paper is the highest-risk pair — verify or darken for <14 px** |
| Non-text contrast | 1.4.11 AA | Focus outline, control borders, gauge vs. track ≥3:1 |
| Focus visible | 2.4.7 / 2.4.11 AA | 3 px outline + offset **[OBSERVED]**; never remove on any input |
| Focus not obscured | 2.4.11 AA | Sticky header offset via `scroll-margin-top`/`scroll-padding-top` **[OBSERVED]** on all anchors |
| Target size | 2.5.8 AA | ≥24 px minimum, 44 px preferred **[OBSERVED]** for primary controls |
| Name/role/value | 4.1.2 AA | Gauge `role="img"`+label or `meter` (UX-15); spinner `aria-valuetext`; segmented `aria-pressed` **[OBSERVED]** |
| Status messages | 4.1.3 AA | Notices `role="status"`, errors `role="alert"` **[OBSERVED]** — queued, non-overwriting (§6.7) |
| Reflow / resize | 1.4.10 / 1.4.4 AA | 320 px no H-scroll; 200% zoom usable — **[NOT VERIFIED]**, test on device |
| Forced colours | 1.4.11 support | `forced-colors: active` — borders via `CanvasText`, gauge uses `Highlight`/forced system colours, no `box-shadow`-only cues |
| Reduced data / contrast | — | Honour `prefers-contrast: more` by strengthening muted text toward ink; no dimmed essential text |
| Motion | 2.3.3 AAA (target) + 2.2.2 AA | §8 contract; no flashing content |
| Labels in name | 2.5.3 AA | Accessible name contains visible text on icon buttons (e.g. "Dismiss", "Cancel scan") |
| Redundant entry / errors | 3.3.7 / 3.3.1 AA | Email fields: inline `aria-describedby` errors (not native `pattern` alone), error summary links to fields |
| Keyboard | 2.1.1 AA | All actions reachable; `<details>`/`<summary>` natively keyboard-operable **[OBSERVED]**; no keyboard traps outside modal trap |

**Verification protocol (before any "AA" claim is printed):** axe + manual keyboard pass at 320/768/1280; screen-reader pass (NVDA/VoiceOver) over scan → preview → pay → report; contrast measured with a tool, recorded in the repo. Today: **[NOT VERIFIED]**.

---

## 10. Competitor patterns referenced (no identity copied)

| Pattern | Source of pattern | How ContractCheck uses it (own identity) |
|---|---|---|
| Traffic-light / gauge scoring | Luminance (Tier A) | Existing gauge + band table (§7.4); own colours, own serif/sans, own copy |
| Clause-side-by-side (original beside explanation) | LegalOn / Spellbook idiom | Existing reading guide; §6.5 locked-card fix keeps source *with* meaning |
| Decision brief / executive summary | Enterprise tools adding exec summaries | Existing "Bottom line" brief; §6.6 anchors priorities to findings |
| Playbook transparency | LegalOn "attorney-built playbooks" | Published rule counts + version in "How the score works" (§6.9) — counts from source, never marketing numbers |
| Free-tier-as-sample | ContractCheck's own 3 demos | Keep; add busy state (UX-07) |

No competitor name, colour, typeface, or layout is reproduced. Competitor pricing/feature claims from Phase 2 are vendor-adjacent and are **not** restated here as facts.

---

## 11. Implementation order & acceptance

**P0 (S1):** routable preview (§7.1) · cancel (§7.2) · Paystack recovery (§7.3) · credit-spend confirm sheet (§6.7/UX-05) — all blocked on the same gate as Phase 3: **one real payment end-to-end [NOT VERIFIED]**.
**P1 (S2):** score bands (§7.4) · locked-card teaser policy (§6.5) · paste-text + file chip (§6.2) · demo busy state · 48 h lines at paywall/checkout (§6.8).
**P2 (S3):** banner queue/scoping (§6.7) · offline listeners · forced-colors + text floor (§5/§9) · PDF success + filename (UX-12) · AI disclosure restructure (§6.3).

**Definition of done per item:** keyboard + screen-reader pass at 320 px and 1280 px; reduced-motion pass; contrast measured; no new 12 px-floor violations; rollback = CSS/token-only where possible.
