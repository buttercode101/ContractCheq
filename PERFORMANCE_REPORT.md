# Performance Report — ContractCheck

Date: 2026-11-06 · Env: Termux, Node v26.3.1 (repo target 24.x).

## Observed
- Live `https://contractcheck.online/`: HTTP 200 in 0.30s (single curl, warm Vercel edge, cpt1).
- Test suite runtime: full `npm test` 14.3s (128 tests, incl. OCR).
- No Lighthouse run executed in this pass → NO Lighthouse scores claimed.

## Targets (not yet measured)
- Lighthouse Performance 90+ / Accessibility 95+ / Best Practices 95+ / SEO 90+; INP ≤200ms; LCP ≤2.5s; CLS ≤0.1.
- Record environment + realistic file sizes/network when measured.

## Notes
- OCR pipeline is the heavyweight path (tesseract worker + canvas rasterise); timeout is 35s with graceful 422. No load test run — data-volume behaviour is UNVERIFIED.
- Vercel Blob round-trips are the other latency surface; storage diagnostic is exposed via health endpoint.
