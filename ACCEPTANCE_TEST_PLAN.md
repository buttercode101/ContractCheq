# Acceptance Test Plan — ContractCheck

Date: 2026-11-06 · Tested commit: `8f77981` + fix set · Env: Termux, Node v26.3.1 (CI: 24.x)

## Core journey
Upload contract → extract text → analyse → preview → purchase → unlock → download → revisit report.

## Mandatory tests — execution results
| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | Valid PDF | PASS | `extraction.test.js` pdf-parse case |
| 2 | Multi-page PDF | PASS | blank+contract 2-page case |
| 3 | Image-based PDF | PASS | vector-scan.pdf pdf-ocr case |
| 4 | OCR | PASS (fixed D-001/D-002) | phone-style PNG → tesseract, clause retained |
| 5 | Corrupt PDF | PASS | error-path tests in suite |
| 6 | Encrypted PDF | PASS | 422 damaged/protected path |
| 7 | Unsupported format | PASS | fileFilter rejection tests |
| 8 | Oversized upload | PASS | multer limits tests |
| 9 | Empty document | PASS | blank-page handling tests |
| 10 | Complex clauses | PASS | riskEngine tests |
| 11 | Conflicting dates | UNKNOWN | no dedicated test found — gap |
| 12 | Missing information | PARTIAL | evidence-linked findings present; coverage thin |
| 13 | Multiple jurisdictions | PASS | SA + UK smoke (85 / 90) |
| 14 | False-positive risk detection | UNKNOWN | no fixture ground truth — gap |
| 15 | False-negative risk detection | UNKNOWN | no fixture ground truth — gap |
| 16 | Source-linked findings | PASS | stored-report assertions |
| 17 | Free preview | PASS | UI journey tests |
| 18 | Successful payment | BLOCKED | simulated only; live Paystack test needs test keys (cost/creds) — owner action |
| 19 | Failed payment | PASS (simulated) | payment journey tests |
| 20 | Duplicate callback | PASS (simulated) | credit-spent-once tests |
| 21 | Interrupted payment | PASS (simulated) | lost-response recovery tests |
| 22 | Refund/entitlement | UNKNOWN | no refund flow found in code — gap |
| 23 | Paid report retrieval | PASS (simulated) | store round-trip tests |
| 24 | PDF download | PASS | jspdf report tests |
| 25 | Cross-user access attempts | UNVERIFIED | IDOR test not found — gap, see SECURITY_REVIEW.md |
| 26 | Storage expiry | UNKNOWN | no TTL test found — gap |
| 27 | Storage recovery | PASS | recovery browser verifier in CI |
| 28 | Mobile upload/report | BLOCKED | no physical device access |

Counts: PASS 18 · PARTIAL 1 · UNKNOWN 6 · BLOCKED 2 · UNVERIFIED 1. Total 28.
