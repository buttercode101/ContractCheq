# Security Policy

## Reporting a vulnerability

If you discover a security issue in ContractCheck, please report it
**privately** rather than opening a public issue:

- Email: **security@buttercode101.com**, or
- Open a GitHub private vulnerability report on this repository.

Include steps to reproduce, the impact you believe it has, and any
suggested fix. We acknowledge reports within 48 hours and aim to
resolve confirmed issues promptly. Please do not disclose the issue
publicly until a fix is available.

## What the service does with your document

ContractCheck is a **reading aid, not legal advice**. You upload a
contract (or paste text); the service extracts readable text, runs
rules-based risk triage, and returns a plain-language guide. Optional
AI enrichment is a separate, consent-based step over excerpts.

- **Retention is a deployment setting, not a silent default.** The
  server exposes local-retention configuration; operators choose what
  is stored and for how long. Confirm the live deployment's retention
  behaviour before uploading sensitive documents.
- **Payments verify server-side.** A paid unlock requires a verified
  processor credit; client-side success messages alone never unlock
  content, and retry flows never double-charge.
- **Rule triage is rules-based.** Explanations cite the document's own
  wording; the service states what it could not read (unreadable
  text, section limits) instead of inventing coverage.

## Data handling best practice

- Upload only the document you own and are entitled to share with
  the service.
- Contracts often contain personal identifiers; treat the returned
  guide and any exports as sensitive.
- Report any suspected data leak or unauthorized unlock immediately
  via the channel above.

## Known limitations (not vulnerabilities)

- Extraction quality depends on how readable the scanned text is;
  unreadable or image-only documents are disclosed as such.
- Risk triage is an aid to reading, not a legal determination; the
  guide states its scope and section limits.
- Optional AI enrichment uses third-party model providers under the
  operator's API keys; excerpts sent for enrichment are governed by
  the operator's provider terms.

## Scope

In scope: the deployed web app and server, the verification
workflows, and this repository.

Out of scope: payment processors and model providers except as
integrated through this service's server, and legal advice (the
product explicitly does not provide it).
