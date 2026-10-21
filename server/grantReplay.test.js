const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
for (const key of ['VERCEL', 'BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN']) delete process.env[key];
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-replay-'));
const store = require('./store');
test('receipt replays and concurrent recovery cannot refill spent report credits', async () => {
  try {
    const purchase = { email: 'buyer@example.test', product: 'pack3', credits: 3 };
    await Promise.all(Array.from({ length: 4 }, () => store.saveGrant('replay-test', purchase)));
    await store.useCredit('replay-test', 'report-1');
    await Promise.all([store.saveGrant('replay-test', purchase), store.useCredit('replay-test', 'report-2')]);
    const recovered = await store.saveGrant('replay-test', purchase);
    assert.equal(recovered.remaining, 1);
    assert.deepEqual(recovered.unlocked, ['report-1', 'report-2']);
    await assert.rejects(store.saveGrant('replay-test', { ...purchase, email: 'other@example.test' }), { status: 409 });
    assert.equal((await store.getGrant('replay-test')).remaining, 1);
  } finally { fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }); }
});
