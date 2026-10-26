const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
for (const key of ['VERCEL','BLOB_STORE_ID','BLOB_READ_WRITE_TOKEN']) delete process.env[key];
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-storage-probe-'));
const app=require('./index');
const store=require('./store');

async function withServer(run){
  const server=app.listen(0);
  await new Promise(r=>server.once('listening',r));
  try{ return await run('http://127.0.0.1:'+server.address().port); }
  finally{ server.close(); }
}

test('an unconfigured deployment reports storage as not writable rather than healthy',async()=>{
  const probe=await store.probeStorage();
  assert.equal(probe.durable,false,'no provider is configured in this test environment');
  assert.equal(probe.writable,false);
  assert.ok(String(probe.error||'').length>0,'a reason must be given, not a bare false');
});

test('the Vercel runtime without a connected provider fails closed and says so',async()=>{
  const before=process.env.DATA_DIR;
  process.env.VERCEL='1';
  delete process.env.DATA_DIR;
  try{
    const probe=await store.probeStorage();
    assert.equal(probe.durable,false);
    assert.equal(probe.writable,false);
    assert.match(String(probe.error),/not connected/i);
  }finally{ delete process.env.VERCEL; process.env.DATA_DIR=before; }
});

test('health reports storage writability separately and stays up when storage cannot persist',async()=>{
  await withServer(async base=>{
    const res=await fetch(base+'/api/health');const body=await res.json();
    assert.equal(res.status,200,'the process being up must not be confused with storage working');
    assert.equal(body.ok,true);
    assert.equal(body.storageConfigured,false);
    assert.equal(body.storageWritable,false);
    assert.ok(String(body.storageError||'').length>0,'monitoring needs the failure reason, not just a boolean');
  });
});

test('the storage diagnostic surfaces the provider error without leaking credentials',async()=>{
  const real=store.probeStorage;
  store.probeStorage=async()=>({durable:true,writable:false,error:'BlobError: Bearer vercel_blob_rw_ExAmPlE1234567890abcdef unauthorized for store'});
  try{
    await withServer(async base=>{
      const res=await fetch(base+'/api/health/storage');const body=await res.json();
      assert.equal(res.status,503);
      assert.equal(body.writable,false);
      assert.match(String(body.error),/unauthorized/i,'the real provider reason must reach the operator');
      const serialised=JSON.stringify(body);
      assert.ok(!/vercel_blob_rw_/.test(serialised),'a token-shaped value must never be returned');
      assert.ok(!/Bearer\s+(?!\[redacted\])/.test(serialised),'authorization headers must be redacted');
      assert.equal('token' in body,false);
    });
  }finally{ store.probeStorage=real; }
});

test('the storage diagnostic reports success when the round trip works',async()=>{
  const real=store.probeStorage;
  store.probeStorage=async()=>({durable:true,writable:true,error:null});
  try{
    await withServer(async base=>{
      const res=await fetch(base+'/api/health/storage');const body=await res.json();
      assert.equal(res.status,200);
      assert.equal(body.ok,true);
      assert.equal(body.writable,true);
      assert.equal(body.error,null);
    });
  }finally{ store.probeStorage=real; }
});
