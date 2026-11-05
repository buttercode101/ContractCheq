const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

// Load the real adapter with @vercel/blob stubbed (unused in Supabase mode)
// and a fake PostgREST fetch. Env is per-instance so suites stay isolated.
function loadStore(){
  const rows=new Map();let seq=0;
  const fetch=async(url,options={})=>{
    const u=new URL(url),method=options.method||'GET',params=u.searchParams;
    const json=(status,body)=>({status,text:async()=>JSON.stringify(body)});
    const eq=v=>v&&v.startsWith('eq.')?decodeURIComponent(v.slice(3)):v;
    const name=eq(params.get('name'));
    if(method==='GET'){
      let out=[...rows.values()];
      if(params.get('name')?.startsWith('like.')){const prefix=decodeURIComponent(params.get('name').slice(5)).replace(/\*$/,'');out=out.filter(r=>r.name.startsWith(prefix));}
      else if(name) out=out.filter(r=>r.name===name);
      const offset=Number(params.get('offset')||0),limit=Number(params.get('limit')||100);
      return json(200,out.sort((a,b)=>a.name.localeCompare(b.name)).slice(offset,offset+limit));
    }
    if(method==='POST'){
      const body=JSON.parse(options.body),prefer=options.headers?.Prefer||'';
      if(rows.has(body.name)&&!prefer.includes('merge-duplicates')) return json(409,{message:'duplicate key value violates unique constraint'});
      const row={name:body.name,value:body.value,revision:'rev-'+(++seq)};rows.set(body.name,row);
      return json(201,[row]);
    }
    if(method==='PATCH'){
      const row=rows.get(name),rev=eq(params.get('revision'));
      if(!row||(rev&&row.revision!==rev)) return json(200,[]);
      row.value=JSON.parse(options.body).value;row.revision='rev-'+(++seq);
      return json(200,[row]);
    }
    if(method==='DELETE'){
      const row=rows.get(name),rev=eq(params.get('revision'));
      if(row&&(!rev||row.revision===rev)) rows.delete(name);
      return json(204,null);
    }
    return json(405,{});
  };
  const module={exports:{}};
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-key'};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'store.js'),'utf8'),{
    module,__dirname,process:{env},console,fetch,URL,Response,TextEncoder,
    require(name){return name==='@vercel/blob'?{}:require(name);},
  });
  return {store:module.exports,rows};
}

test('supabase backend: durable and probe round-trip cleanly',async()=>{
  const {store,rows}=loadStore();
  assert.equal(store.durable(),true);
  const probe=await store.probeStorage();
  assert.equal(probe.writable,true,probe.error||'');
  assert.equal(rows.size,0,'probe row must be deleted');
});

test('supabase backend: analysis save/read and create-only conflict',async()=>{
  const {store}=loadStore();
  await store.saveAnalysis('a1',{_id:'a1',title:'Lease'});
  assert.equal((await store.getAnalysis('a1')).full.title,'Lease');
  await assert.rejects(()=>store.saveAnalysis('a1',{_id:'a1'}),/already exists/);
});

test('supabase backend: grant credit spends exactly once',async()=>{
  const {store}=loadStore();
  await store.saveGrant('CC-TEST-1234567890',{email:'a@example.com',product:'single',credits:1});
  assert.equal((await store.useCredit('CC-TEST-1234567890','a1')).remaining,0);
  assert.equal(await store.useCredit('CC-TEST-1234567890','a2'),null,'overspend must be refused');
  assert.equal((await store.useCredit('CC-TEST-1234567890','a1')).remaining,0,'replay of unlocked analysis stays free');
});
