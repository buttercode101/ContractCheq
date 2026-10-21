const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
for (const key of ['VERCEL', 'BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN']) delete process.env[key];
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-retention-'));
const store = require('./store');

test('local expiry deletes report text while preserving live reports, receipts and unrelated files', async () => {
  const root = process.env.DATA_DIR;
  const reportFile = id => fs.readdirSync(root).map(name => path.join(root, name)).find(file => JSON.parse(fs.readFileSync(file, 'utf8')).full?._id === id);
  try {
    for (const id of ['expired-read', 'expired-sweep', 'live']) await store.saveAnalysis(id, { _id: id, extracted: 'Synthetic contract text' });
    await store.saveGrant('retain-paid-credit', { email: 'buyer@example.test', product: 'pack3', credits: 3 });
    await store.track('page_view', { jurisdiction: 'ZA' });
    for (const id of ['expired-read', 'expired-sweep']) {
      const file = reportFile(id), record = JSON.parse(fs.readFileSync(file, 'utf8'));
      record.at = Date.now() - 49 * 3600 * 1000;
      fs.writeFileSync(file, JSON.stringify(record));
    }
    const expired = reportFile('expired-read');
    assert.equal(await store.getAnalysis('expired-read'), null);
    assert.ok(!fs.existsSync(expired), 'expired text must be removed on access');
    const swept = reportFile('expired-sweep');
    const unrelated = path.join(root, 'notes.json');
    fs.writeFileSync(unrelated, '{"full":{"_id":"unrelated"},"at":0}');
    const mismatched = path.join(root, '0'.repeat(64) + '.json');
    fs.writeFileSync(mismatched, '{"full":{"_id":"unrelated"},"at":0}');
    await store.cleanupExpired();
    await store.cleanupExpired();
    assert.ok(!fs.existsSync(swept), 'daily cleanup must delete unopened expired reports');
    assert.equal((await store.getAnalysis('live')).full.extracted, 'Synthetic contract text');
    assert.equal((await store.getGrant('retain-paid-credit')).remaining, 3);
    assert.ok(fs.existsSync(unrelated));
    assert.ok(fs.existsSync(mismatched), 'a payload must match its hashed analysis key');
    assert.ok(fs.readdirSync(root).some(name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')).name === 'page_view'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
