const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'contractcheck-tests-'));
process.env.PAYSTACK_SECRET_KEY='test-only';
const store=require('./store');
const app=require('./index');
test('uploads and payment authorization reject mismatches, replay and overspending',async()=>{
 const server=app.listen(0); await new Promise(r=>server.once('listening',r));
 const base='http://127.0.0.1:'+server.address().port;
 const realFetch=global.fetch;
 const verified={status:true,data:{status:'success',amount:1900,currency:'ZAR',customer:{email:'buyer@example.test'},metadata:{product:'single'}}};
 global.fetch=(url,options)=>String(url).startsWith('https://api.paystack.co/')?Promise.resolve({ok:true,json:async()=>verified}):realFetch(url,options);
 const post=async(route,body)=>{const r=await realFetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 try {
  const input={text:'The landlord may enter the premises at any time without notice. The deposit is non-refundable.',jurisdiction:'ZA'};
  const a=await post('/api/analyze-text',input);const b=await post('/api/analyze-text',input);
  assert.equal(a.status,200);assert.equal(a.body.isPaid,false);assert.ok(a.body.issuesCount>0);
  assert.equal(a.body.exposure,undefined);assert.equal(a.body.highlightedClauses,undefined);
  assert.ok(a.body.issues.every(x=>x.recommendation===undefined&&x.impact===undefined));
  assert.equal((await post('/api/analyze-text',{text:{}})).status,400);
  assert.equal((await post('/api/analyze-text',{text:'   ',jurisdiction:'ZA'})).status,400);
  assert.equal((await post('/api/analyze-text',{text:'ordinary contract wording',jurisdiction:'XX'})).status,400);
  const ui=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
  assert.ok(ui.includes("'/100 · '+d.level"),'Demo cards must derive their risk label from demo data');
  const broken = new FormData();
  broken.append('file', new Blob([Buffer.from('%PDF-1.4\nthis is deliberately corrupt')], {type:'application/pdf'}), 'broken.pdf');
  broken.append('jurisdiction','ZA');
  const brokenRes = await realFetch(base+'/api/analyze',{method:'POST',body:broken});
  assert.equal(brokenRes.status,422);
  const brokenBody = await brokenRes.json();
  assert.match(brokenBody.error,/could not be read|damaged|password-protected/i);
  assert.equal((await post('/api/unlock-analysis',{analysisId:a.body._id,grantId:'credit',email:'buyer@example.test'})).status,402);
  store.durable=()=>true; // Allow the test Paystack verifier while retaining a temporary local ledger.
  const receipt={reference:'CC-deployment-test-receipt',email:'buyer@example.test',product:'single'};
  assert.equal((await post('/api/verify-payment',{...receipt,product:'pack10'})).status,402);
  verified.data.amount=1;assert.equal((await post('/api/verify-payment',receipt)).status,402);verified.data.amount=1900;
  verified.data.currency='NGN';assert.equal((await post('/api/verify-payment',receipt)).status,402);verified.data.currency='ZAR';
  assert.equal((await post('/api/verify-payment',{...receipt,email:'other@example.test'})).status,403);
  assert.equal((await post('/api/verify-payment',receipt)).body.credits,1);
  assert.equal((await post('/api/verify-payment',receipt)).body.credits,1);
  const unlock={analysisId:a.body._id,reference:receipt.reference,email:receipt.email};
  const full=await post('/api/unlock-analysis',unlock);assert.equal(full.status,200);assert.equal(full.body.credits,0);assert.ok(full.body.issues[0].recommendation);
  assert.equal((await post('/api/unlock-analysis',unlock)).status,200);
  assert.equal((await post('/api/unlock-analysis',{...unlock,analysisId:b.body._id})).status,402);
  assert.equal((await post('/api/verify-payment',receipt)).body.credits,0);
  assert.equal((await post('/api/unlock-analysis',{...unlock,email:'other@example.test'})).status,403);
 } finally {global.fetch=realFetch;server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});


test('keyboard and motion accessibility invariants remain in the shipped UI',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'..','public','app.css'),'utf8');
 assert.match(html,/className:['"]skip-link['"]/);
 assert.match(html,/['"]aria-live['"]\s*:/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
});
