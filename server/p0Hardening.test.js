const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { analyseContract } = require('./riskEngine');

test('timing-safe Bearer check handles length mismatch and unset secret', async () => {
  const { isBearerAuthorized, timingSafeEqualString } = require('./secretCompare');
  assert.equal(timingSafeEqualString('abc', 'abc'), true);
  assert.equal(timingSafeEqualString('abc', 'abd'), false);
  assert.equal(timingSafeEqualString('abc', 'abcd'), false); // must not throw
  assert.equal(timingSafeEqualString('', ''), true);
  assert.equal(isBearerAuthorized('Bearer s3cret', 's3cret'), true);
  assert.equal(isBearerAuthorized('Bearer wrong', 's3cret'), false);
  assert.equal(isBearerAuthorized('Bearer s3cret-longer', 's3cret'), false);
  assert.equal(isBearerAuthorized('Bearer s3cret', ''), false);
  assert.equal(isBearerAuthorized('Bearer s3cret', undefined), false);
  assert.equal(isBearerAuthorized(undefined, 's3cret'), false);
  assert.equal(isBearerAuthorized('Basic s3cret', 's3cret'), false);
});

test('GET /api/report/:id never leaks full report without an unlocking grant', async () => {
  for (const k of ['VERCEL', 'BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_TABLE']) delete process.env[k];
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-p0-'));
  const store = require('./store');
  const app = require('./index');
  const server = app.listen(0);
  await new Promise(r => server.once('listening', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const analysis = analyseContract('EMPLOYMENT AGREEMENT. The employee shall work 55 hours per week. ' + 'Clause '.repeat(40), 'scan.txt');
    analysis._id = 'p0-report-1';
    analysis.isPaid = false;
    await store.saveAnalysis('p0-report-1', analysis);

    // Unauthenticated: free preview only, paid fields stripped.
    const free = await fetch(base + '/api/report/p0-report-1');
    assert.equal(free.status, 200);
    const freeBody = await free.json();
    assert.equal(freeBody.freePreview, true);
    assert.equal(freeBody.isPaid, false);
    assert.ok(!('plainLanguageGuide' in freeBody) || !freeBody.plainLanguageGuide || freeBody.issuesLocked);

    // Unknown id and credentialed-but-not-unlocked are indistinguishable (404, same message).
    const missing = await fetch(base + '/api/report/does-not-exist');
    assert.equal(missing.status, 404);
    const missingBody = await missing.json();
    const bogus = await fetch(base + '/api/report/p0-report-1', { headers: { 'x-payment-reference': 'CC-NOTAREAL-123456' } });
    assert.equal(bogus.status, 404);
    assert.deepEqual(await bogus.json(), missingBody);

    // Grant that has NOT unlocked this id: still 404, no leak.
    await store.saveGrant('CC-TESTGRANT-123456', { email: 'buyer@example.test', product: 'single', amount: 1900, credits: 1 });
    const notUnlocked = await fetch(base + '/api/report/p0-report-1', { headers: { 'x-payment-reference': 'CC-TESTGRANT-123456' } });
    assert.equal(notUnlocked.status, 404);

    // After unlock via the existing flow, the same credential returns the full report.
    const unlock = await fetch(base + '/api/unlock-analysis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisId: 'p0-report-1', reference: 'CC-TESTGRANT-123456', email: 'buyer@example.test' }),
    });
    assert.equal(unlock.status, 200);
    const full = await fetch(base + '/api/report/p0-report-1', {
      headers: { 'x-payment-reference': 'CC-TESTGRANT-123456', 'x-receipt-email': 'buyer@example.test' },
    });
    assert.equal(full.status, 200);
    const fullBody = await full.json();
    assert.equal(fullBody.isPaid, true);
    assert.equal(fullBody._id, 'p0-report-1');

    // Wrong email for the same reference: 404, no leak.
    const wrongEmail = await fetch(base + '/api/report/p0-report-1', {
      headers: { 'x-payment-reference': 'CC-TESTGRANT-123456', 'x-receipt-email': 'other@example.test' },
    });
    assert.equal(wrongEmail.status, 404);

    // Path-traversal style ids are rejected.
    const trav = await fetch(base + '/api/report/' + encodeURIComponent('../secret'));
    assert.equal(trav.status, 400);
  } finally {
    server.close();
    fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  }
});
