/** Private durable storage; optimistic concurrency protects report credits. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { put, get, del, list } = require('@vercel/blob');
const ROOT = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const durable = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
const digest = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const key = (kind, id) => `contractcheck/${kind}/${digest(id)}.json`;
function ensure() { if (!durable() && !process.env.VERCEL) fs.mkdirSync(ROOT, {recursive:true}); }
async function readObject(name) {
  if (durable()) {
    const r = await get(name, { access:'private', useCache:false });
    if (!r) return null;
    return {value:await new Response(r.stream).json(), etag:r.blob.etag};
  }
  if(process.env.VERCEL) throw new Error('Private storage is not connected yet.');
  ensure(); const p = path.join(ROOT, digest(name)+'.json');
  try { return {value:JSON.parse(fs.readFileSync(p,'utf8')),etag:null}; }
  catch(e) { if(e.code==='ENOENT') return null; throw e; }
}
async function writeObject(name,value,etag,create=false) {
  if(durable()) return put(name, JSON.stringify(value), {access:'private',addRandomSuffix:false,
    contentType:'application/json',allowOverwrite:!create,...(etag?{ifMatch:etag}:{})});
  if(process.env.VERCEL) throw new Error('Private storage is not connected yet.');
  ensure(); const p=path.join(ROOT,digest(name)+'.json');
  fs.writeFileSync(p,JSON.stringify(value),{flag:create?'wx':'w'});
}
const conflict=e=>e.code==='EEXIST'||/already exists|precondition|etag/i.test(e.message||e.name);
async function saveAnalysis(id,full) { await writeObject(key('analyses',id),{full,at:Date.now()},null,true); }
async function getAnalysis(id) {
  const name=key('analyses',id); const r=await readObject(name);
  if(!r) return null;
  if(r.value.at < Date.now()-48*3600*1000) {
    if(durable()) await del(name,{ifMatch:r.etag});
    return null;
  }
  return r.value;
}
async function saveGrant(reference,data) {
  const name=key('grants',reference);
  try { await writeObject(name,{...data,remaining:data.credits,unlocked:[],at:Date.now()},null,true); }
  catch(e) { if(!conflict(e)) throw e; }
  return getGrant(reference);
}
async function getGrant(reference) { return (await readObject(key('grants',reference)))?.value || null; }
async function useCredit(reference,analysisId) {
  const name=key('grants',reference);
  for(let i=0;i<5;i++) {
    const r=await readObject(name); if(!r) return null;
    const g=r.value;
    if(g.unlocked.includes(analysisId)) return g;
    if(g.remaining<1) return null;
    const next={...g,remaining:g.remaining-1,unlocked:[...g.unlocked,analysisId]};
    try { await writeObject(name,next,r.etag); return next; }
    catch(e) { if(!conflict(e)) throw e; }
  }
  throw new Error('Another report is unlocking. Please retry.');
}
async function track(name,props={}) {
  // Never persist document names, excerpts, email addresses, or receipt references in telemetry.
  const safe=Object.fromEntries(['jurisdiction','method','issues','score','product','amount','via'].filter(k=>k in props).map(k=>[k,props[k]]));
  await writeObject(key('events',crypto.randomUUID()),{name,props:safe,at:Date.now()},null,true);
}
async function metrics() { return {durable:durable()}; }
async function cleanupExpired() {
  if(!durable()) return;
  let cursor; const cut=Date.now()-48*3600*1000;
  do {
    const batch=await list({prefix:'contractcheck/analyses/',cursor,limit:100});
    for(const b of batch.blobs) if(new Date(b.uploadedAt).getTime()<cut) await del(b.url);
    cursor=batch.hasMore?batch.cursor:undefined;
  } while(cursor);
}
module.exports={ensure,saveAnalysis,getAnalysis,saveGrant,getGrant,useCredit,track,metrics,durable,cleanupExpired};
