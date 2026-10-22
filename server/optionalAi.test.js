const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
for (const key of ['VERCEL', 'BLOB_STORE_ID', 'BLOB_READ_WRITE_TOKEN']) delete process.env[key];
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-ai-'));
process.env.AI_ENRICHMENT_ENABLED = 'true';
process.env.OPENROUTER_API_KEY = 'test-only';
process.env.TINYFISH_API_KEY = 'test-only';
process.env.AI_RESEARCH_ENABLED = 'true';
process.env.GROQ_API_KEY = 'test-only';
const app = require('./index');
test('optional AI requires upload consent, uses bounded calls and labels grounded OpenRouter evidence', async () => {
 const realFetch = global.fetch, calls = [];
 const quote = 'The tenant shall pay R8000 each month.';
 global.fetch = async (url, options) => {
  calls.push({ url: String(url), options });
  assert(options.signal, 'Every external provider call needs a deadline');
  if (String(url).includes('tinyfish')) return { ok: true, json: async () => ({ results: [] }) };
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({extraIssues: [
   { excerpt: quote, analysis: 'Review the payment obligation.', law: 'AI review', severity: 'MEDIUM RISK' },
   { excerpt: 'This invented clause is absent from the document.', analysis: 'Invented risk' }
  ]}) } }] }) };
 };
 const server = app.listen(0); await new Promise(r => server.once('listening', r));
 try {
  async function scan(enrich) {
   const form = new FormData();
   form.set('file', new Blob(['RESIDENTIAL LEASE. ' + quote + ' Email buyer@example.test. ID 9001011234088. Phone 0821234567.'], {type:'text/plain'}), 'lease.txt');
   if (enrich) form.set('enrich', '1');
   const response = await realFetch('http://127.0.0.1:' + server.address().port + '/api/analyze', {method:'POST', body:form});
   assert.equal(response.status, 200); return response.json();
  }
  await scan(false); assert.equal(calls.length, 0);
  const result = await scan(true);
  assert.equal(result.llmEnriched, true);assert.equal(result.aiStatus,'completed');
  assert.equal(result.issues.filter(x => x.source === 'openrouter').length, 1);
  const completion = calls.find(x => x.url.includes('openrouter'));
  const request=JSON.parse(completion.options.body);assert.equal(request.model,'deepseek/deepseek-v4-flash');assert.equal(request.provider.zdr,true);assert.equal(request.provider.data_collection,'deny');assert.equal(request.provider.sort,'price');assert.deepEqual(request.provider.max_price,{prompt:0.10,completion:0.30,request:0});assert.equal(request.max_tokens,1600);assert.equal(request.reasoning.enabled,false);
  for (const sensitive of ['buyer@example.test', '9001011234088', '0821234567']) assert(!completion.options.body.includes(sensitive));
  assert(!decodeURIComponent(calls.find(x => x.url.includes('tinyfish')).url).includes('R8000'));
  assert(!result.issues.some(x => x.excerpt.includes('invented clause')));
 } finally { global.fetch = realFetch; server.close(); fs.rmSync(process.env.DATA_DIR, { recursive:true, force:true }); }
});
