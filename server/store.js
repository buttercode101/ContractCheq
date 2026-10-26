/** Private durable storage; optimistic concurrency protects report credits. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { put, get, del, list } = require('@vercel/blob');

const ROOT = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const durable = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
const digest = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const key = (kind, id) => `contractcheck/${kind}/${digest(id)}.json`;

function ensure() {
  if (!durable() && !process.env.VERCEL) fs.mkdirSync(ROOT, { recursive: true });
}

async function readObject(name) {
  if (durable()) {
    const r = await get(name, { access: 'private', useCache: false });
    if (!r) return null;
    return { value: await new Response(r.stream).json(), etag: r.blob.etag };
  }
  if (process.env.VERCEL) throw new Error('Private storage is not connected yet.');
  ensure();
  const p = path.join(ROOT, digest(name) + '.json');
  try {
    const bytes = fs.readFileSync(p, 'utf8');
    return { value: JSON.parse(bytes), etag: digest(bytes) };
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function writeObject(name, value, etag, create = false) {
  if (durable()) {
    return put(name, JSON.stringify(value), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
      allowOverwrite: !create,
      ...(etag ? { ifMatch: etag } : {}),
    });
  }
  if (process.env.VERCEL) throw new Error('Private storage is not connected yet.');
  ensure();
  const p = path.join(ROOT, digest(name) + '.json');
  if (etag) {
    if (!fs.existsSync(p)) throw Object.assign(new Error('ETag mismatch'), { code: 'PRECONDITION_FAILED' });
    const existing = fs.readFileSync(p, 'utf8');
    if (digest(existing) !== etag) throw Object.assign(new Error('ETag mismatch'), { code: 'PRECONDITION_FAILED' });
  }
  fs.writeFileSync(p, JSON.stringify(value), { flag: create ? 'wx' : 'w' });
}

const conflict = e => e.code === 'EEXIST' || /already exists|precondition|etag/i.test(e.message || e.name);

async function saveAnalysis(id, full) {
  await writeObject(key('analyses', id), { full, at: Date.now() }, null, true);
}

async function getAnalysis(id) {
  const name = key('analyses', id);
  const r = await readObject(name);
  if (!r) return null;
  if (r.value.at < Date.now() - 48 * 3600 * 1000) {
    if (durable()) await del(name, { ifMatch: r.etag });
    else fs.rmSync(path.join(ROOT, digest(name) + '.json'), { force: true });
    return null;
  }
  return r.value;
}

function normaliseReference(reference) {
  return String(reference || '').trim();
}

async function getGrant(reference) {
  const normalized = normaliseReference(reference);
  if (!normalized) return null;
  const item = (await readObject(key('grants', normalized)))?.value || null;
  return item;
}

async function saveGrant(reference, data) {
  const normalized = normaliseReference(reference);
  if (!normalized) throw new Error('Missing payment reference');

  const name = key('grants', normalized);
  // A verified transaction creates a grant once. Replays must never overwrite
  // remaining credits or a concurrent unlock's ledger.
  try {
    await writeObject(name, { ...data, remaining: data.credits, unlocked: [], at: Date.now() }, null, true);
  } catch (error) {
    if (!conflict(error)) throw error;
  }
  const existing = await getGrant(normalized);
  if (!existing) throw new Error('Payment receipt could not be saved.');
  if (String(existing.email || '').toLowerCase().trim() !== String(data.email || '').toLowerCase().trim() || existing.product !== data.product) {
    throw Object.assign(new Error('Receipt already belongs to a different purchase.'), { status: 409 });
  }
  return existing;
}

async function useCredit(reference, analysisId) {
  const normalized = normaliseReference(reference);
  const name = key('grants', normalized);
  for (let i = 0; i < 5; i++) {
    const r = await readObject(name);
    if (!r) return null;
    const g = r.value;
    if (g.unlocked.includes(analysisId)) return g;
    if (g.remaining < 1) return null;
    const next = { ...g, remaining: g.remaining - 1, unlocked: [...g.unlocked, analysisId] };
    try {
      await writeObject(name, next, r.etag);
      return next;
    } catch (e) {
      if (!conflict(e)) throw e;
    }
  }
  throw new Error('Another report is unlocking. Please retry.');
}

async function track(name, props = {}) {
  // Never persist document names, excerpts, email addresses, or receipt references in telemetry.
  const safe = {};
  for (const k of ['jurisdiction', 'method', 'product', 'via']) {
    const allowed = {
      jurisdiction: ['ZA', 'UK'],
      method: ['pdf-parse', 'pdf-ocr', 'tesseract', 'plain-text', 'client-text'],
      product: ['single', 'pack3', 'pack10'],
      via: ['verified_credit'],
    };
    if (allowed[k].includes(props[k])) safe[k] = props[k];
  }
  for (const k of ['issues', 'score', 'amount']) if (typeof props[k] === 'number' && Number.isFinite(props[k])) safe[k] = props[k];

  const eventNames = [
    'page_view', 'demo_open', 'upload_start', 'analysis_view', 'analyze_error', 'paywall_click', 'pay_close',
    'export_pdf', 'attorney_referral_click', 'payment_verified', 'analyze_complete', 'unlock_success',
    'analyze_text', 'other',
  ];

  const event = { name: eventNames.includes(name) ? name : 'other', props: safe, at: Date.now() };
  console.info('[telemetry]', JSON.stringify(event));
  // Keep production telemetry in platform logs, preserving Blob operations for reports and credits.
  if (!durable() && !process.env.VERCEL) await writeObject(key('events', crypto.randomUUID()), event, null, true);
}

async function metrics() {
  return { durable: durable() };
}

async function cleanupExpired() {
  const cut = Date.now() - 48 * 3600 * 1000;
  if (!durable()) {
    if (process.env.VERCEL) return;
    ensure();
    for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
      if (!entry.isFile() || !/^[a-f0-9]{64}\.json$/.test(entry.name)) continue;
      const file = path.join(ROOT, entry.name);
      let record;
      try { record = JSON.parse(fs.readFileSync(file, 'utf8')); }
      catch (error) { if (error instanceof SyntaxError) continue; throw error; }
      const id = record?.full?._id;
      // Match the analysis key as well as its payload before deleting anything.
      if (typeof id === 'string' && entry.name === digest(key('analyses', id)) + '.json' &&
          Number.isFinite(record.at) && record.at < cut) fs.rmSync(file, { force: true });
    }
    return;
  }
  let cursor;
  do {
    const batch = await list({ prefix: 'contractcheck/analyses/', cursor, limit: 100 });
    for (const b of batch.blobs) if (new Date(b.uploadedAt).getTime() < cut) await del(b.url);
    cursor = batch.hasMore ? batch.cursor : undefined;
  } while (cursor);
}

/** Real write/read/delete round trip. The presence of an environment variable is NOT
 *  evidence that private storage works: a suspended store or revoked token still
 *  looks "configured" while every write fails. This is the honest check. */
async function probeStorage() {
  if (!durable()) {
    return { durable: false, writable: false,
      error: process.env.VERCEL ? 'Private storage is not connected yet.' : 'Local storage mode; no storage provider is configured.' };
  }
  const name = key('probe', Date.now() + '-' + crypto.randomUUID());
  const payload = { at: Date.now() };
  try {
    await writeObject(name, payload, null, true);
    const written = await readObject(name);
    if (!written || written.value?.at !== payload.at) {
      return { durable: true, writable: false, error: 'A storage write completed but the record could not be read back.' };
    }
    await del(name, { ifMatch: written.etag });
    return { durable: true, writable: true, error: null };
  } catch (error) {
    return { durable: true, writable: false, error: String((error && error.message) || error) };
  }
}

module.exports = { ensure, saveAnalysis, getAnalysis, saveGrant, getGrant, useCredit, track, metrics, durable, probeStorage, cleanupExpired };
