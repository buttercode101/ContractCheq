![CI](https://github.com/buttercode101/ContractCheq/actions/workflows/production-ci.yml/badge.svg)

# ContractCheck

**Understand the wording. Spot risks. Ask better questions before you sign.**

ContractCheck helps people reviewing leases, employment agreements and service contracts make sense of a document before committing to it. Upload a document or paste its text, choose the jurisdiction and review a source-linked risk preview. A full-report unlock adds a plain-language reading guide and practical questions to take back to the other party.

[Open ContractCheck](https://contractcheck.online) · [Run locally](#quick-start) · [Technical notes](docs/TECHNICAL-NOTES.md) · [Verification](REPOSITORY-VERIFICATION.md)

## From document to next steps

1. Upload a supported PDF, image or text file, or paste contract text.
2. Choose South Africa or the United Kingdom and the relevant contract type.
3. Read the free risk preview and compare flagged wording with the original.
4. Unlock a full report for source-linked explanations, payment wording, role-specific questions and PDF export.
5. Optionally save an editable checklist on your device. Confirm dates yourself before exporting calendar items.

## When it helps

| Situation | What to look at |
| --- | --- |
| You are renting a home | Deposit, access, notice and termination wording |
| You receive an employment agreement | Pay, notice, restrictions and obligations |
| You quote for freelance work | Scope, revisions, acceptance, payment and ownership |
| You are comparing agreements | Original excerpts and questions needing clarification |

This is a reading aid and rules-based risk triage, not legal advice or a guarantee that every issue has been found. Explanations depend on readable extracted text. The guide includes at most 400 extracted sections and discloses its coverage. Optional AI enrichment is a separate, consent-based excerpt review; the core reading guide works without it.

## Free preview and full reports

The free preview withholds paid fields on the server. Full-report credits currently cost R19 for one, R39 for three or R99 for ten. Receipt recovery uses the original Paystack reference and email. Repeated unlocks of the same report do not consume another credit. Test-provider responses do not establish a settled real payment.

## Quick start

Use Node.js 24 and npm, then:

```bash
npm ci
cp .env.example .env
npm start
```

Open http://localhost:3000. Local storage supports development; payment and optional provider features need their own server credentials. Leave AI disabled unless deliberately configured. Never use production financial records in tests.

```bash
npm test
npm run test:smoke
npm audit --omit=dev --audit-level=high
```

## Data and deployment

The canonical public origin is **https://contractcheck.online**. Production rejects other public hosts; retain the existing host policy and protected Vercel deployment URLs. The canonical branch is `main`.

Production uses private Vercel Blob storage. Scans expire after 48 hours, with daily cleanup; uploaded originals are deleted after processing. Reports retain extracted wording needed for explanations. Browser checklists survive independently until removed or browser storage is cleared. Optional AI sends consented excerpts to configured providers. See [technical notes](docs/TECHNICAL-NOTES.md) for storage, receipt recovery, provider limits, environment variables and hosting requirements.

## Project guide

- [Repository verification and remaining acceptance](REPOSITORY-VERIFICATION.md)
- [Implementation, privacy and deployment details](docs/TECHNICAL-NOTES.md)
- [UI audit](UI-AUDIT-2026-10-22.md) and [full audit](FULL-AUDIT-2026-10-22.md) — dated evidence
- [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md)
