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
  try { const bytes=fs.readFileSync(p,'utf8');return {value:JSON.parse(bytes),etag:digest(bytes)}; }
  catch(e) { if(e.code==='ENOENT') return null; throw e; }
}
async function writeObject(name,value,etag,create=false) {
  if(durable()) return put(name, JSON.stringify(value), {access:'private',addRandomSuffix:false,
    contentType:'application/json',allowOverwrite:!create,...(etag?{ifMatch:etag}:{})});
  if(process.env.VERCEL) throw new Error('Private storage is not connected yet.');
  ensure(); const p=path.join(ROOT,digest(name)+'.json');
  if (etag) {
    if (!fs.existsSync(p)) throw Object.assign(new Error('ETag mismatch'), { code: 'PRECONDITION_FAILED' });
    const existing = fs.readFileSync(p, 'utf8');
    if (digest(existing) !== etag) throw Object.assign(new Error('ETag mismatch'), { code: 'PRECONDITION_FAILED' });
  }
  fs.writeFileSync(p, JSON.stringify(value), { flag: create ? 'wx' : 'w' });
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
  const normalized = String(reference || '').trim();
  if (!normalized) throw new Error('Missing payment reference');
  const name = key('grants', normalized);
  const existing = await getGrant(normalized);
  const email = String(data?.email || '').toLowerCase().trim();
  if (existing && existing.email && email && existing.email !== email) {
    throw Object.assign(new Error('Receipt already belongs to a different email address.'), { status: 409 });
  }
  try { await writeObject(name,{...data,remaining:data.credits,unlocked:existing?.unlocked || [],at:Date.now()},existing ? existing._etag || null : null, !existing); }
  catch(e) { if(!conflict(e)) throw e; }
  return getGrant(normalized);
}
async function getGrant(reference) {
  const grant = (await readObject(key('grants', reference)))?.value || null;
  if (!grant) return null;
  return { ...grant, _etag: (await readObject(key('grants', reference))).etag };
}
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
  const safe={};
  for (const k of ['jurisdiction','method','product','via']) {
    const allowed={jurisdiction:['ZA','UK'],method:['pdf-parse','pdf-ocr','tesseract','plain-text','client-text'],product:['single','pack3','pack10'],via:['verified_credit']};
    if(allowed[k].includes(props[k])) safe[k]=props[k];
  }
  for (const k of ['issues','score','amount']) if(typeof props[k]==='number'&&Number.isFinite(props[k])) safe[k]=props[k];
  const eventNames=['page_view','demo_open','upload_start','analysis_view','analyze_error','paywall_click','pay_close','export_pdf','attorney_referral_click','payment_verified','analyze_complete','unlock_success','analyze_text','other'];
  const event={name:eventNames.includes(name)?name:'other',props:safe,at:Date.now()};
  // Production-readable telemetry without exposing contract text, filenames, email or payment references.
  console.info('[telemetry]', JSON.stringify(event));
  await writeObject(key('events',crypto.randomUUID()),event,null,true);
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
