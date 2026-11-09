const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

for (const key of ['VERCEL', 'BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_TABLE']) delete process.env[key];
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-webhook-'));
process.env.PAYSTACK_SECRET_KEY = 'test-webhook-secret';
const app = require('./index');
const store = require('./store');

const SECRET = 'test-webhook-secret';
const sign = (raw) => crypto.createHmac('sha512', SECRET).update(raw).digest('hex');

test('Paystack webhook: HMAC-verified, idempotent grants', async () => {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const realFetch = global.fetch;
  // Mutable verified-transaction fixture so the wrong-amount case can diverge.
  let verified = {
    status: 'success', amount: 1900, currency: 'ZAR',
    customer: { email: 'buyer@example.test' }, metadata: { product: 'single' },
  };
  let verifyCalls = 0;
  const post = async (raw, signature) => {
    const headers = { 'Content-Type': 'application/json' };
    if (signature !== undefined) headers['x-paystack-signature'] = signature;
    const r = await realFetch(base + '/api/paystack-webhook', { method: 'POST', headers, body: raw });
    return { status: r.status, body: await r.json() };
  };
  const payloadFor = (reference, event = 'charge.success') => JSON.stringify({
    event, data: { reference, amount: 1900, currency: 'ZAR', customer: { email: 'buyer@example.test' }, metadata: { product: 'single' } },
  });
  try {
    global.fetch = async (url, options) => {
      if (String(url).startsWith('https://api.paystack.co/')) {
        verifyCalls++;
        return { ok: true, json: async () => ({ status: true, data: verified }) };
      }
      return realFetch(url, options);
    };

    // 1. Valid signature grants credits.
    const goodRaw = payloadFor('CC-webhook-grant-0001');
    const good = await post(goodRaw, sign(goodRaw));
    assert.equal(good.status, 200, JSON.stringify(good.body));
    assert.equal(good.body.granted, true);
    assert.equal(good.body.credits, 1);
    assert.equal(good.body.amount, 1900);
    assert.equal((await store.getGrant('CC-webhook-grant-0001')).remaining, 1);

    // 2. Replay (same event) is idempotent: duplicate flag, no refill, no extra verify call needed for grant.
    const callsBeforeReplay = verifyCalls;
    const replay = await post(goodRaw, sign(goodRaw));
    assert.equal(replay.status, 200);
    assert.equal(replay.body.duplicate, true);
    assert.equal((await store.getGrant('CC-webhook-grant-0001')).remaining, 1);
    assert.equal(verifyCalls, callsBeforeReplay, 'dedupe should short-circuit before re-verify');

    // 2b. Replay past the in-memory dedupe (fresh event id, same reference) still
    // cannot refill: spend the credit first, then the write-once saveGrant must
    // return the existing grant with remaining=0, not a fresh 1.
    await store.useCredit('CC-webhook-grant-0001', 'report-spend-1');
    const replay2Raw = JSON.stringify({ event: 'charge.success', id: 999001, data: { reference: 'CC-webhook-grant-0001', amount: 1900, currency: 'ZAR', metadata: { product: 'single' } } });
    const replay2 = await post(replay2Raw, sign(replay2Raw));
    assert.equal(replay2.status, 200);
    assert.equal(replay2.body.granted, true);
    assert.equal(replay2.body.credits, 0, 'write-once grant must not refill a spent credit');
    assert.equal((await store.getGrant('CC-webhook-grant-0001')).remaining, 0);

    // 3. Invalid signature -> 400, no grant.
    const badRaw = payloadFor('CC-webhook-badsig-0001');
    const bad = await post(badRaw, '0'.repeat(128));
    assert.equal(bad.status, 400);
    assert.equal(await store.getGrant('CC-webhook-badsig-0001'), null);

    // 4. Missing signature -> 400, no grant.
    const missing = await post(payloadFor('CC-webhook-nosig-0001'));
    assert.equal(missing.status, 400);
    assert.equal(await store.getGrant('CC-webhook-nosig-0001'), null);

    // 5. Wrong amount (server-side verify disagrees with PRICES) -> 402, no grant.
    verified = { ...verified, amount: 100 };
    const wrongRaw = payloadFor('CC-webhook-wrongamt-01');
    const wrong = await post(wrongRaw, sign(wrongRaw));
    assert.equal(wrong.status, 402);
    assert.match(wrong.body.error, /product mismatch/);
    assert.equal(await store.getGrant('CC-webhook-wrongamt-01'), null);
    verified = { status: 'success', amount: 1900, currency: 'ZAR', customer: { email: 'buyer@example.test' }, metadata: { product: 'single' } };

    // 6. Unsupported event is acknowledged (200, ignored) so Paystack stops retrying it.
    const otherRaw = payloadFor('CC-webhook-other-ev-001', 'transfer.success');
    const other = await post(otherRaw, sign(otherRaw));
    assert.equal(other.status, 200);
    assert.equal(other.body.ignored, true);
    assert.equal(await store.getGrant('CC-webhook-other-ev-001'), null);

    // 7. invoice.payment_succeeded also grants (pack3 pricing via server verify).
    verified = { status: 'success', amount: 3900, currency: 'ZAR', customer: { email: 'buyer@example.test' }, metadata: { product: 'pack3' } };
    const invRaw = JSON.stringify({ event: 'invoice.payment_succeeded', data: { reference: 'CC-webhook-invoice-001', amount: 3900, currency: 'ZAR', metadata: { product: 'pack3' } } });
    const inv = await post(invRaw, sign(invRaw));
    assert.equal(inv.status, 200, JSON.stringify(inv.body));
    assert.equal(inv.body.granted, true);
    assert.equal(inv.body.credits, 3);
  } finally {
    global.fetch = realFetch;
    server.close();
    fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  }
});
