const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
for(const k of ['VERCEL','BLOB_STORE_ID','BLOB_READ_WRITE_TOKEN']) delete process.env[k];
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-release-'));
process.env.CONTRACTCHECK_STORAGE_TOKEN='a'.repeat(64);
const app=require('./index'),store=require('./store');
const request=(base,route,method='GET',body,headers={})=>new Promise((resolve,reject)=>{
 const req=http.request(base+route,{method,headers:{host:'contractcheck.online',...headers}},res=>{
  let text='';res.setEncoding('utf8');res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(text)}));
 });req.on('error',reject);if(body)req.write(body);req.end();
});
test('malformed non-ASCII admin credentials return 403 and leave the process serving',async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  const r=await request(base,'/api/admin/storage-inventory','GET',null,{authorization:'Bearer '+'é'.repeat(64)});assert.equal(r.status,403);
  assert.equal((await request(base,'/api/health')).status,200);
 }finally{await new Promise(r=>server.close(r));}
});
test('production outage rejects file and text requests before validation, processing or saving',async()=>{
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const oldProbe=store.probeStorage,oldSave=store.saveAnalysis;let saves=0;
 process.env.VERCEL='1';store.probeStorage=async()=>({durable:true,writable:false,error:'secret-provider-canary'});store.saveAnalysis=async()=>{saves++;throw Error('must not run')};
 try{
  await request(base,'/api/health/storage');
  for(const [route,body,headers] of [
   ['/api/analyze','intentionally invalid multipart body',{'content-type':'multipart/form-data; boundary=fixture'}],
   ['/api/analyze-text',JSON.stringify({text:'',useAI:true}),{'content-type':'application/json'}]
  ]){
   const r=await request(base,route,'POST',body,headers);assert.equal(r.status,503);assert.equal(r.headers['retry-after'],'300');assert.equal(r.body.code,'STORAGE_UNAVAILABLE');assert.ok(!JSON.stringify(r.body).includes('secret-provider-canary'));
  }
  assert.equal(saves,0);
 }finally{store.probeStorage=oldProbe;store.saveAnalysis=oldSave;delete process.env.VERCEL;await new Promise(r=>server.close(r));fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
