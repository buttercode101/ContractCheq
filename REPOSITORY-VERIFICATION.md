# Repository verification — 26 October 2026

## Scope and baseline

Inspected the actual repository, package/configuration files, existing workflow definitions and release notes. Baseline commit: `03e78864ebadf08bb7707117e5697932c0c9c90f`. This record covers repository presentation, developer setup, local verification and the maintenance changes listed below.

## Changes

Reorganised the README around the customer journey and preserved the former implementation/release content in docs/TECHNICAL-NOTES.md. Updated compatible locked dependencies and pinned the transitive Zod override to 4.6.7. npm audit previously reported seven high-severity dependency findings; it now reports zero. Added contribution/security guidance and a pull-request template.

## Executed checks

`npm test`: 114 passed; `npm run test:smoke`: passed; `npm audit --omit=dev --audit-level=high`: zero reported vulnerabilities after dependency updates.

Documentation links and diff whitespace were checked before publishing. Automated test counts describe this run; older audit documents retain their historical counts.

## Release boundaries

Local source checks are passing in this scope. Remote CI execution and current Vercel source/deployment equality are not certified by this record. No live payment was made and no physical phone, native capture picker or complete production user journey was exercised in this repository pass. Existing dated live evidence remains evidence for its recorded release only.

A clean build or audit does not establish complete product reliability. Production acceptance remains separate. No claim that every source module or every possible failure case was audited is made here.

## Dependency repair

Patched resolved versions include multer 2.5.0, body-parser 1.20.9, undici 6.29.1 and Zod 4.6.7. The Zod override avoids the audit suggestion to downgrade the storage SDK. Retain it until the upstream dependency range resolves safely without it. Advisory references: https://github.com/advisories/GHSA-q7qp-rjg7-q26m , https://github.com/advisories/GHSA-27r3-jxmh-p828 , https://github.com/advisories/GHSA-4qv8-2p9j-2685 , https://github.com/advisories/GHSA-xjj6-f33q-929c and https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 .

Rollback means restoring the preceding package.json and lockfile together, then running npm ci. Such a rollback also restores known advisory findings; evaluate the risk rather than deploying it silently.
