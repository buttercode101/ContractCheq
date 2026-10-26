const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual storage adapter with a failing provider. A temporary-file
// fallback must never turn an outage or concurrency conflict into a saved report.
function storage(blob, env = { VERCEL: '1', BLOB_STORE_ID: 'test-store' }) {
  const writes = [];
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'store.js'), 'utf8'), {
    module, __dirname, process: { env }, console,
    require(name) {
      if (name === '@vercel/blob') return blob;
      if (name === 'fs') return new Proxy(fs, { get(target, key) {
        if (['writeFileSync', 'mkdirSync'].includes(key)) return (...args) => writes.push(args);
        return target[key];
      }});
      return require(name);
    },
  });
  return { store: module.exports, writes };
}

test('provider outages and conditional-write conflicts propagate without a local fallback', async () => {
  for (const code of ['STORE_SUSPENDED', 'PRECONDITION_FAILED', 'UNAUTHORIZED']) {
    const error = Object.assign(new Error(code), { code });
    const { store, writes } = storage({ put: async () => { throw error; } });
    await assert.rejects(store.saveAnalysis('test-report', {}), e => e === error);
    assert.equal(writes.length, 0);
  }
});

test('failed private reads remain failures rather than a misleading missing report', async () => {
  const error = new Error('Private storage unavailable');
  const { store, writes } = storage({ get: async () => { throw error; } });
  await assert.rejects(store.getAnalysis('test-report'), e => e === error);
  assert.equal(writes.length, 0);
});

test('a serverless deployment without durable storage cannot save reports or receipts', async () => {
  const { store, writes } = storage({}, { VERCEL: '1' });
  await assert.rejects(store.saveAnalysis('test-report', {}), /not connected/);
  await assert.rejects(store.saveGrant('test-receipt', { credits: 1 }), /not connected/);
  assert.equal(writes.length, 0);
});
