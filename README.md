# ContractCheck SA v3.1

The default `main` branch is the source for the `contractcheck-sa-v3` Vercel project. Both `contractcheck-sa-v3.vercel.app` and `contract-check-v3-sa.vercel.app` are production domains of that project.

## Paid plain-language reading guide

## New in this build (perspective-aware analysis)

- **Verdict**: Clear SIGN / NEGOTIATE / REJECT based on score and severity.
- **Suggested wording**: Cleaner recommended language on every flagged issue.
- **Tighter missing checks**: Additional role- and type-specific completeness rules (quiet enjoyment, disciplinary procedure, liability cap).

- **Role selector**: Choose tenant, landlord, employee, employer, or neutral before scanning. Perspective influences missing-protection checks and prioritisation.
- **Suggested wording**: Every flagged issue now includes concrete recommended language where a rule provides it.
- **Key dates & periods**: Automatically extracted and shown in the report.
- **Expanded missing-clause checks**: Additional completeness rules for residential leases (entry notice) and employment (overtime pay), tailored by role.

All analysis remains rules-based and local by default. Not legal advice.

Every full-report unlock includes a searchable guide to the extracted contract wording, not just risk flags. Each text section includes topic explanations, simpler wording for common legal phrases where supported, its original wording, exact amounts and time periods, context-sensitive legal-word definitions and questions to ask. Conditions, negations and cross-references are retained. Unrecognised wording and references needing context are marked for closer reading.

The guide uses the local explanation engine; it does not require optional AI enrichment or send additional document text to third parties. It covers at most the first 400 extracted text sections and reports the included/total count. This is a reading aid, not a full paraphrase of every possible contract, a replacement agreement, a guarantee of finding hidden clauses or a decision about enforceability. Missing attachments and unreadable text cannot be explained.

The guide is included in the PDF export and the public full-report examples. It is withheld server-side from free previews and returned through the existing verified-credit unlock flow. Older saved reports without a guide show a clear rescan message.

## Run

`npm ci` then `npm start`. Run `npm test` and `npm run test:smoke`.

Vercel build: tests run before build. Production domain: contractcheck-sa-v3.vercel.app.

Not legal advice.