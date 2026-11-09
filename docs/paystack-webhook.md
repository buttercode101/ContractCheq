# Paystack webhook

Server-side credit granting for payments where the browser callback
(`POST /api/verify-payment`) never runs — e.g. the buyer pays and then
closes the tab. Previously such credits were only recoverable manually via
Restore; the webhook grants them automatically.

## Endpoint

```
POST https://<deployment-origin>/api/paystack-webhook
Content-Type: application/json
x-paystack-signature: <hex HMAC-SHA512 of the raw request body>
```

- The route is mounted with a raw-body parser **before** `express.json()`,
  for this route only, so the exact bytes Paystack signed are verified.
- Signature = `HMAC-SHA512(rawBody, PAYSTACK_SECRET_KEY)`, compared with a
  timing-safe compare (`server/secretCompare.js#timingSafeEqualString`).
- Missing or invalid signature → `400`. No `PAYSTACK_SECRET_KEY` configured → `503`.

## Events handled

| Paystack event | Behaviour |
|---|---|
| `charge.success` | Grant (see below) |
| `invoice.payment_succeeded` | Grant (see below) |
| any other event | `200 {ok:true, ignored:true}` — acknowledged so Paystack stops retrying |

For grantable events the handler:

1. Extracts `data.reference` and only accepts ContractCheq references
   (`CC-…`, same pattern as `/api/verify-payment`); anything else is
   `200 {ok:true, ignored:true}`.
2. **Re-verifies server-side** via the existing `verifyPaystack()` call
   (`GET https://api.paystack.co/transaction/verify/<reference>`).
   The webhook payload alone is never trusted.
3. Requires `data.status === 'success'`, `amount === PRICES[metadata.product]`
   (single R19 / pack3 R39 / pack10 R99, in cents), and `currency === 'ZAR'`;
   otherwise `402` and no grant.
4. Calls `store.saveGrant(reference, …)` with the verified customer email,
   product, amount and credit count (1 / 3 / 10). `saveGrant` is write-once,
   so replays never refill spent credits.
5. Returns `200 {ok:true, granted:true, grantId, product, credits, amount}`.

Transient failures (Paystack verify error, storage unavailable on Vercel)
return `502`/`503` so Paystack retries delivery; permanent validation
failures return `400`/`402`.

## Dedupe

Each delivery is logged as `[paystack-webhook] {"event":…,"eventId":…,"reference":…}`
(event id / reference only — never bodies, emails, or signatures).
An in-memory set of processed event ids (falling back to
`<event>:<reference>`, capped at 1000 entries) short-circuits exact replays
with `200 {ok:true, duplicate:true}`. This is best-effort on serverless
platforms (it does not survive cold starts); durability comes from the
write-once `saveGrant` described above.

## Paystack dashboard setup (manual, once)

> Do not point this at a live dashboard from automated tooling. Steps for a
> human with dashboard access:

1. Paystack Dashboard → **Settings → API Keys & Webhooks** (or
   **Developers → Webhooks**, wording varies by dashboard version).
2. **Add a new endpoint** with the webhook URL — the production origin
   above, incl. the `/api/paystack-webhook` path. Use the live/test URL
   matching the mode (`PAYSTACK_SECRET_KEY`) configured on the deployment.
3. Select events: **`charge.success`** and **`invoice.payment_succeeded`**
   (leave others unselected unless needed).
4. Save. Confirm the endpoint shows as active.
5. Make a real (or Paystack test-mode) payment with a `CC-…` reference and
   confirm the grant appears without the browser callback — e.g. complete
   payment in a private window, close it immediately, then check
   `GET /api/credits` with the `x-payment-reference` header, or retry
   `/api/verify-payment` (Restore) and confirm the credit count is unchanged
   (the webhook already granted it, exactly once).
6. If the endpoint ever shows repeated failures, check server logs for
   `[paystack-webhook]` lines and the `Invalid webhook signature` `400`s —
   those mean the deployment's `PAYSTACK_SECRET_KEY` does not match the
   Paystack environment the endpoint was registered in.

## Local smoke test (no Paystack interaction)

Generate a signature over an arbitrary payload with the test secret and
POST it locally; a wrong-secret signature must yield `400`:

```bash
SECRET=test-only
BODY='{"event":"charge.success","data":{"reference":"CC-local-smoke-0001"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha512 -hmac "$SECRET" | awk '{print $NF}')
curl -i -X POST http://localhost:3000/api/paystack-webhook \
  -H 'Content-Type: application/json' -H "x-paystack-signature: $SIG" -d "$BODY"
```

With a non-matching deployment secret this returns `400`
`Invalid webhook signature`. A matching secret proceeds to server-side
Paystack verification (which will fail/`404` for a fake reference) — that
failure proves the signature check passed and the raw-body path is wired.

## Tests

`server/paystackWebhook.test.js` covers: valid signature grants, exact
replay dedupe, replay past dedupe cannot refill a spent credit, invalid
signature `400`, missing signature `400`, wrong amount `402` with no grant,
unsupported event ignored, and `invoice.payment_succeeded` granting pack3.
