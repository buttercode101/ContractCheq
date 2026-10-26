const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
for(const k of ['VERCEL','BLOB_STORE_ID','BLOB_READ_WRITE_TOKEN']) delete process.env[k];
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-outage-'));
const app=require('./index'),store=require('./store');
test('storage suspension returns retryable 503 for uploaded and pasted contracts without leaking provider details',async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port,original=store.saveAnalysis;
 store.saveAnalysis=async()=>{throw Object.assign(new Error('Vercel Blob: This store has been suspended. private-canary'),{name:'BlobStoreSuspendedError'});};
 try {
  const text='Residential lease: monthly rent R5000, payable on the first day. Notice is one month.';
  const form=new FormData();form.set('file',new Blob([text],{type:'text/plain'}),'synthetic.txt');
  for(const [route,options] of [['/api/analyze',{method:'POST',body:form}],['/api/analyze-text',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text})}]]){
   const response=await fetch(base+route,options),body=await response.json();assert.equal(response.status,503);assert.equal(response.headers.get('retry-after'),'300');assert.equal(body.code,'STORAGE_UNAVAILABLE');assert.ok(!JSON.stringify(body).includes('private-canary'));
  }
 } finally {store.saveAnalysis=original;server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
test('production telemetry does not write Blob objects',async()=>{
 process.env.BLOB_STORE_ID='synthetic-no-network';
 try {await store.track('page_view',{jurisdiction:'ZA'});} finally {delete process.env.BLOB_STORE_ID;}
});
