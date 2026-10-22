const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
for (const name of ['VERCEL', 'BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN']) delete process.env[name];
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-input-safety-'));
const app = require('./index');

test('binary and damaged text is rejected before analysis or storage', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const bytes of [Buffer.alloc(60), Buffer.alloc(60, 0xff), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.alloc(61, 65)])]) {
      const form = new FormData();
      form.set('file', new Blob([bytes], { type: 'text/plain' }), 'damaged.txt');
      const response = await fetch(url + '/api/analyze', { method: 'POST', body: form });
      const body = await response.json();
      assert.equal(response.status, 422, JSON.stringify(body));
      assert.match(body.error, /text|encoding/i);
      assert.equal(body.score, undefined);
    }
    const response = await fetch(url + '/api/analyze-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '\0'.repeat(60) }) });
    assert.equal(response.status, 422);
    assert.deepEqual(fs.readdirSync(process.env.DATA_DIR), []);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('valid UTF-8 and UTF-16 text preserves contract wording', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const text = 'RESIDENTIAL LEASE. Landlord may enter the dwelling without notice. Rent is R8 000. Café résumé.';
  const little = Buffer.from(text, 'utf16le');
  try {
    for (const bytes of [Buffer.from(text), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text)]), Buffer.concat([Buffer.from([0xff, 0xfe]), little]), Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(little).swap16()])]) {
      const form = new FormData(); form.set('file', new Blob([bytes], { type: 'text/plain' }), 'lease.txt');
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/analyze', { method: 'POST', body: form });
      const body = await response.json();
      assert.equal(response.status, 200, body.error);
      const saved = await require('./store').getAnalysis(body._id);
      assert.ok(saved.full.plainLanguageGuide.sections.some(section => section.original.includes('Café résumé.')));
      assert.ok(body.issues.some(issue => issue.id.startsWith('rha-entry')));
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('invalid scan options fail before document decoding', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const [field, value] of [['jurisdiction', 'US'], ['perspective', 'invented-role']]) {
      const form = new FormData();
      form.set('file', new Blob(['damaged image'], { type: 'image/png' }), 'damaged.png');
      form.set(field, value);
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/analyze', { method: 'POST', body: form });
      assert.equal(response.status, 400, JSON.stringify(await response.json()));
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('an OCR worker that starts after the deadline is terminated without recognition', async () => {
  const tesseract = require('tesseract.js');
  const original = tesseract.createWorker;
  let finishStartup, terminated = 0, recognized = 0;
  tesseract.createWorker = () => new Promise(resolve => { finishStartup = resolve; });
  try {
    await assert.rejects(app.__internal.extractFromImage(Buffer.from('not used'), 10), /timed out/i);
    finishStartup({ terminate: async () => { terminated++; }, recognize: async () => { recognized++; return { data: { text: 'late', confidence: 100 } }; } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(terminated, 1);
    assert.equal(recognized, 0);
  } finally { tesseract.createWorker = original; }
});

test.after(() => fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true }));
