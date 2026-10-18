const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
for(const key of ['VERCEL','BLOB_STORE_ID','BLOB_READ_WRITE_TOKEN'])delete process.env[key];
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-deep-'));
process.env.GROQ_API_KEY='test-only';process.env.PAYSTACK_SECRET_KEY='test-only';
const app=require('./index'),store=require('./store');
test('untrusted inputs, analytics failures and invented AI evidence cannot corrupt reports or credits',async(t)=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 const base='http://127.0.0.1:'+server.address().port,realFetch=global.fetch,realTrack=store.track,realDurable=store.durable;
 const post=async(route,body)=>{const r=await realFetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 const text='RESIDENTIAL LEASE. The tenant shall pay R8000 each month. The landlord may enter the dwelling without notice.';
 try {
  assert.equal((await post('/api/analyze-text',{text:' '.repeat(40)})).status,400);
  assert.equal((await post('/api/analyze-text',{text,fileName:{bad:true}})).status,400);
  assert.equal((await post('/api/analyze-text',{text:'a'.repeat(200001)})).status,413);
  const big=new FormData();big.set('file',new Blob(['a'.repeat(200001)],{type:'text/plain'}),'big.txt');
  assert.equal((await realFetch(base+'/api/analyze',{method:'POST',body:big})).status,413);
  const blank=new FormData();blank.set('file',new Blob([' '.repeat(40)],{type:'text/plain'}),'blank.txt');
  assert.equal((await realFetch(base+'/api/analyze',{method:'POST',body:blank})).status,422);
  await realTrack('page_view',{jurisdiction:{document:'private'},via:'private text',issues:1,score:99,amount:NaN,email:'private@example.test'});
  const event=fs.readdirSync(process.env.DATA_DIR).map(f=>JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR,f)))).find(x=>x.name==='page_view');
  assert.deepEqual(event.props,{issues:1,score:99});
  store.track=async()=>{throw new Error('Analytics disk unavailable');};
  await store.saveGrant('concurrent-single',{credits:1,email:'race@example.test'});
  const attempts=await Promise.all(['first','second'].map(id=>store.useCredit('concurrent-single',id)));
  assert.equal(attempts.filter(Boolean).length,1);assert.equal((await store.getGrant('concurrent-single')).remaining,0);
  const scan=await post('/api/analyze-text',{text});assert.equal(scan.status,200);
  global.fetch=async(url,options)=>{
   if(String(url).startsWith('https://api.paystack.co/')){assert.ok(options.signal);const product=String(url).includes('pack10')?'pack10':String(url).includes('pack3')?'pack3':'single';return {ok:true,json:async()=>({status:true,data:{status:'success',amount:{single:1900,pack3:3900,pack10:9900}[product],currency:'ZAR',customer:{email:'buyer@example.test'},metadata:{product}}})};}
   if(String(url).startsWith('https://api.groq.com/')){assert.ok(options.signal);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({extraIssues:[{excerpt:'This clause does not exist in the uploaded contract',analysis:'Invented risk',severity:'HIGH RISK'},{excerpt:'The tenant shall pay R8000 each month.',analysis:{bad:true}}]})}}]})};}
   return realFetch(url,options);
  };
  const form=new FormData();form.set('file',new Blob([text],{type:'text/plain'}),'lease.txt');form.set('enrich','1');
  const ai=await realFetch(base+'/api/analyze',{method:'POST',body:form});assert.equal(ai.status,200);
  const body=await ai.json();assert.ok(!body.issues.some(i=>i.source==='groq'));
  store.durable=()=>true;
  const receipt={reference:'CC-recovery-deep-audit',email:'buyer@example.test'};
  const verified=await post('/api/verify-payment',receipt);assert.equal(verified.status,200);assert.equal(verified.body.credits,1);
  const unlock={analysisId:scan.body._id,...receipt};
  assert.equal((await post('/api/unlock-analysis',{...unlock,reopenOnly:true})).status,403);
  assert.equal((await store.getGrant(receipt.reference)).remaining,1);
  const full=await post('/api/unlock-analysis',unlock);assert.equal(full.status,200);assert.equal(full.body.credits,0);assert.ok(full.body.plainLanguageGuide);
  assert.equal((await post('/api/unlock-analysis',{...unlock,reopenOnly:true})).status,200);
  assert.equal((await post('/api/unlock-analysis',unlock)).status,200);
  await t.test('receipt recovery lists only owned retained reports without spending credits',async()=>{
   const recovered=await post('/api/verify-payment',receipt);
   assert.equal(recovered.status,200);assert.equal(recovered.body.credits,0);
   assert.equal(recovered.body.reports.length,1);
   assert.equal(recovered.body.reports[0].id,scan.body._id);
   assert.equal(recovered.body.reports[0].title,full.body.docTitle);
   assert.ok(recovered.body.reports[0].expiresAt>Date.now());
   assert.deepEqual(Object.keys(recovered.body.reports[0]).sort(),['expiresAt','id','jurisdiction','title']);
   const wrong=await post('/api/verify-payment',{...receipt,email:'other@example.test'});
   assert.equal(wrong.status,403);assert.equal(wrong.body.reports,undefined);
   const unrelated=await post('/api/verify-payment',{...receipt,reference:'CC-other-recovery-receipt'});
   assert.equal(unrelated.body.credits,1);assert.deepEqual(unrelated.body.reports,[]);
   assert.equal((await store.getGrant(receipt.reference)).remaining,0);
  });
  for(const [product,credits] of [['pack3',3],['pack10',10]]){
   const r={reference:'CC-deep-'+product+'-receipt',email:'buyer@example.test'};
   assert.equal((await post('/api/verify-payment',r)).body.credits,credits);
   assert.equal((await post('/api/unlock-analysis',{analysisId:scan.body._id,...r})).body.credits,credits-1);
   assert.equal((await post('/api/unlock-analysis',{analysisId:scan.body._id,...r})).body.credits,credits-1);
   assert.equal((await post('/api/verify-payment',r)).body.credits,credits-1);
  }
  await t.test('receipt recovery omits expired report metadata and refuses expired reopen',async()=>{
   const savedFile=fs.readdirSync(process.env.DATA_DIR).find(f=>{
    const item=JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR,f)));
    return item.full?._id===scan.body._id;
   });
   assert.ok(savedFile);
   const location=path.join(process.env.DATA_DIR,savedFile),saved=JSON.parse(fs.readFileSync(location));
   saved.at=Date.now()-49*3600*1000;fs.writeFileSync(location,JSON.stringify(saved));
   const recovered=await post('/api/verify-payment',receipt);
   assert.equal(recovered.status,200);assert.equal(recovered.body.credits,0);assert.deepEqual(recovered.body.reports,[]);
   assert.equal((await post('/api/unlock-analysis',{...unlock,reopenOnly:true})).status,404);
   assert.equal((await store.getGrant(receipt.reference)).remaining,0);
  });
  const home=await realFetch(base);assert.match(home.headers.get('content-security-policy'),/script-src 'self' 'sha256-/);
  assert.ok(!home.headers.get('content-security-policy').split(';').find(x=>x.trim().startsWith('script-src')).includes('unsafe-inline'));
 }finally{global.fetch=realFetch;store.track=realTrack;store.durable=realDurable;server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
