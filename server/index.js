/**
 * ContractCheck SA v3 — production server
 * Upload → OCR/text → SA/UK rules → optional Groq+TinyFish → freemium unlock → Paystack verify
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { analyseContract } = require('./riskEngine');
const DEMO_SAMPLES = require('./demoSamples');
const store = require('./store');

const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_MB = process.env.VERCEL ? 4 : (Number(process.env.MAX_FILE_MB) || 12);
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY || '';
const PRICES = { single: 1900, pack3: 3900, pack10: 9900 }; // kobo/cents

store.ensure();

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use('/api', (_req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.VERCEL ? '/tmp/contractcheck-uploads' : path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /pdf|image|png|jpe?g|webp|bmp|tiff?|txt|plain/i.test(file.mimetype) ||
      /\.(pdf|png|jpe?g|webp|bmp|tiff?|txt)$/i.test(file.originalname || '');
    const err=ok?null:Object.assign(new Error('Only PDF, images, or .txt allowed'),{status:400});
    cb(err, ok);
  },
});

const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, message:{error:'Too many scans. Please wait 15 minutes before trying again.'} });
const payLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, message:{error:'Too many payment requests. Please wait 15 minutes before trying again.'} });
const eventLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true });

function cleanup(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

async function extractFromPdf(filePath) {
  // Keep PDF.js native Path2D compatible with its canvas renderer.
  const graphics = require(require.resolve('@napi-rs/canvas', {paths:[path.dirname(require.resolve('pdf-parse'))]}));
  globalThis.DOMMatrix = graphics.DOMMatrix;
  globalThis.ImageData = graphics.ImageData;
  globalThis.Path2D = graphics.Path2D;
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({data:fs.readFileSync(filePath)});
  try {
    const data = await parser.getText();
    const pages = data.total || 1;
    const extractedPages = data.pages || [];
    const scanned = extractedPages.filter(p => (p.text || '').replace(/\s/g,'').length < 30).map(p => p.num);
    // OCR every image-only page, including mixed PDFs; never silently ignore later pages.
    if (scanned.length > 3) throw Object.assign(new Error('This PDF has more than 3 scanned pages. Split it into files of up to 3 pages.'), {status:422});
    let confidence = 0.9;
    if (scanned.length) {
      const screenshots = await parser.getScreenshot({partial:scanned,desiredWidth:1600,imageDataUrl:false});
      for (const image of screenshots.pages) {
        const result = await extractFromImage(Buffer.from(image.data),12000);
        const target = extractedPages.find(p => p.num === image.pageNumber);
        if (target) target.text = result.text;
        confidence = Math.min(confidence, result.confidence);
        if (result.text.length < 30) throw Object.assign(new Error('A scanned page could not be read. Upload a sharper scan or photo.'),{status:422});
      }
    }
    const text = extractedPages.length ? extractedPages.map(p => p.text).join('\n\n').trim() : (data.text||'').trim();
    return {text,pages,method:scanned.length?'pdf-ocr':'pdf-parse',confidence,
      warning:confidence<0.75?'Some text may be unclear. Verify the extracted clauses against your original document.':null};
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error('This PDF could not be read. It may be damaged or password-protected. Upload an unlocked PDF or a clear photo.'), {status:422});
  } finally {await parser.destroy();}
}

async function extractFromImage(filePath, timeoutMs = 35000) {
  const Tesseract=require('tesseract.js');
  let worker, timer;
  const work=(async()=> {
    worker=await Tesseract.createWorker('eng',1,{
      cachePath:'/tmp',
      langPath:path.join(path.dirname(require.resolve('@tesseract.js-data/eng/package.json')),'4.0.0_best_int'),
      workerPath:require.resolve('tesseract.js/src/worker-script/node/index.js'),
      logger:()=>{}
    });
    const graphics=require('@napi-rs/canvas');
    let input=filePath;
    try {let image;
      const bytes=Buffer.isBuffer(filePath)?filePath:fs.readFileSync(filePath);
      if(bytes.subarray(0,4).equals(Buffer.from([0x49,0x49,0x2a,0]))||bytes.subarray(0,4).equals(Buffer.from([0x4d,0x4d,0,0x2a]))){
        const UTIF=require('utif'),pages=UTIF.decode(bytes);
        if(pages.length!==1) throw Object.assign(new Error('Upload a single-page TIFF or convert multiple pages to PDF.'),{status:422});
        const page=pages[0];if(!page.t256?.[0]||!page.t257?.[0]||page.t256[0]*page.t257[0]>25000000) throw Object.assign(new Error('Image is too large or invalid. Resize it below 25 megapixels.'),{status:422});
        UTIF.decodeImage(bytes,page);const rgba=UTIF.toRGBA8(page);
        image=graphics.createCanvas(page.width,page.height);image.getContext('2d').putImageData(new graphics.ImageData(new Uint8ClampedArray(rgba),page.width,page.height),0,0);
      }else image=await graphics.loadImage(bytes);
      if(image.width*image.height>25000000) throw Object.assign(new Error('Image is too large. Resize it below 25 megapixels.'),{status:422});
      const canvas=graphics.createCanvas(image.width,image.height);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,image.width,image.height);ctx.drawImage(image,0,0);input=canvas.toBuffer('image/png');
    } catch(error) {if(error.status) throw error;throw Object.assign(new Error('This image could not be read. Try a clear PNG, JPG or WebP photo.'),{status:422});}
    const result=await worker.recognize(input);
    const text=(result.data?.text||'').trim();
    return {text,pages:1,method:'tesseract',confidence:(result.data?.confidence||0)/100,
      warning:text.length<30?'OCR returned little text. Try a sharper photo.':null};
  })();
  try {
    return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Image recognition timed out. Try a smaller, sharper photo.')),timeoutMs);})]);
  } finally {clearTimeout(timer);if(worker) await worker.terminate();}
}

function decodeText(buffer) {
  if (buffer[0]===0xff && buffer[1]===0xfe) return buffer.subarray(2).toString('utf16le');
  if (buffer[0]===0xfe && buffer[1]===0xff) {
    const copy=Buffer.from(buffer.subarray(2));if(copy.length%2) throw Object.assign(new Error('Invalid UTF-16 text file.'),{status:422});
    return copy.swap16().toString('utf16le');
  }
  return buffer.toString('utf8').replace(/^\uFEFF/,'');
}

async function extractText(file) {
  const name = (file.originalname || '').toLowerCase();
  const mime = file.mimetype || '';
  if (mime.includes('pdf') || name.endsWith('.pdf')) return extractFromPdf(file.path);
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name)) return extractFromImage(file.path);
  if (mime.includes('text') || name.endsWith('.txt')) {
    return { text: decodeText(fs.readFileSync(file.path)), pages: 1, method: 'plain-text', confidence: 1 };
  }
  // try pdf then image
  try { return await extractFromPdf(file.path); } catch (_) {}
  return extractFromImage(file.path);
}

async function callGroq(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const models = [
    process.env.GROQ_MODEL,
    'openai/gpt-oss-20b',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
  ].filter(Boolean);
  for (const m of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: m,
          messages,
          temperature: 0.2,
          max_tokens: 1600,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) continue;
      const j = await res.json();
      return { content: j.choices?.[0]?.message?.content || '', model: m };
    } catch (e) {
      console.warn('Groq', m, e.message);
    }
  }
  return null;
}

async function tinyfishSearch(query) {
  const key = process.env.TINYFISH_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.search.tinyfish.ai?query=${encodeURIComponent(query)}&language=en`, {
      headers: { 'X-API-Key': key },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hits = data.results || data.items || [];
    return (Array.isArray(hits) ? hits : []).slice(0, 4).map((h) => ({
      title: h.title || '',
      url: h.url || h.link || '',
      snippet: (h.snippet || h.description || '').slice(0, 200),
    }));
  } catch (e) {
    console.warn('TinyFish', e.message);
    return null;
  }
}

async function enrichWithLLM(analysis, rawText) {
  if (!process.env.GROQ_API_KEY && !process.env.TINYFISH_API_KEY) return analysis;

  let researchNote = null;
  const snippets = await tinyfishSearch(
    `${analysis.jurisdiction || 'ZA'} ${analysis.docType || 'contract'} unfair terms ${analysis.issues?.[0]?.law || 'consumer employment tenancy'}`
  );
  if (snippets?.length) {
    researchNote = snippets.map((s) => `${s.title}: ${s.snippet}`).join('\n');
    analysis.researchSources = snippets;
  }

  if (!process.env.GROQ_API_KEY) {
    return { ...analysis, llmEnriched: false, tinyfishResearch: Boolean(researchNote), researchNote };
  }

  const system = `You are a contract risk assistant for ${analysis.jurisdiction === 'UK' ? 'United Kingdom' : 'South African'} law.
CHECK & FLAG ONLY — never rewrite clauses. Respond JSON only:
{"extraIssues":[{"law":"","severity":"HIGH RISK|MEDIUM RISK","excerpt":"","analysis":"","recommendation":"","impact":"","lawRef":""}],"summaryNote":""}
Max 3 extra issues. Only clear legal risks.`;

  const user = `Type: ${analysis.docType}\nScore so far: ${analysis.score}\nText:\n${rawText.slice(0, 5000)}\n${researchNote ? `Research:\n${researchNote.slice(0, 700)}` : ''}\nJSON only.`;

  try {
    const groq = await callGroq([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    if (!groq?.content) return { ...analysis, llmEnriched: false, researchNote };

    const parsed = JSON.parse(groq.content.replace(/```json|```/g, '').trim());
    const extra = (Array.isArray(parsed.extraIssues) ? parsed.extraIssues : []).slice(0, 3)
      .filter((e) => e && (e.analysis || e.excerpt))
      .map((e, i) => ({
        id: `ai-${i}-${Date.now()}`,
        law: e.law || 'AI review',
        lawRef: e.lawRef || e.law || '',
        riskScore: String(e.severity || '').includes('HIGH') ? '80/100' : '65/100',
        severity: e.severity || 'MEDIUM RISK',
        excerpt: e.excerpt || '',
        analysis: e.analysis || '',
        recommendation: e.recommendation || '',
        impact: e.impact || '',
        tags: ['AI'],
        source: 'groq',
      }));

    const issues = [...analysis.issues, ...extra];
    const score = Math.min(95, analysis.score + extra.length * 5);
    return {
      ...analysis,
      issues,
      issuesCount: issues.length,
      score,
      level: score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk',
      llmNote: parsed.summaryNote || null,
      llmEnriched: true,
      llmModel: groq.model,
      researchNote,
      tinyfishResearch: Boolean(researchNote),
    };
  } catch (e) {
    console.warn('enrich', e.message);
    return { ...analysis, llmEnriched: false, researchNote };
  }
}

function freeViewOf(analysis) {
  return {
    ...analysis,
    issues: analysis.issues.slice(0, 3).map(({recommendation,impact,...preview}) => preview),
    exposure: undefined,
    highlightedClauses: undefined,
    issuesLocked: analysis.issues.slice(3).map((i) => ({
      id: i.id,
      severity: i.severity,
      law: i.law,
      riskScore: i.riskScore,
      locked: true,
    })),
    issuesPreview: analysis.issues.map((i) => ({
      id: i.id,
      severity: i.severity,
      law: i.law,
      riskScore: i.riskScore,
    })),
    rawText: undefined,
    freePreview: true,
    isPaid: false,
  };
}

async function verifyPaystack(reference) {
  if (!PAYSTACK_SECRET) throw new Error('Payments are not configured.');
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const body = await res.json();
  if (!res.ok || !body.status) throw new Error(body.message || 'Paystack verify failed');
  return body;
}

// ——— Routes ———

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    version: '3.0.0',
    paystack: Boolean(PAYSTACK_SECRET && PAYSTACK_PUBLIC && store.durable()),
    storage: store.durable(),
    groq: Boolean(process.env.GROQ_API_KEY),
    tinyfish: Boolean(process.env.TINYFISH_API_KEY),
  });
});

app.get('/api/demo/:key', (req,res) => {
  const sample=DEMO_SAMPLES[req.params.key];
  if(!sample) return res.status(404).json({error:'Example not found'});
  const analysis=analyseContract(sample.text,sample.fileName,sample.jurisdiction);
  analysis.docTitle=sample.title;
  analysis._id='demo-'+req.params.key;
  analysis.isDemo=true;
  analysis.isPaid=true;
  analysis.freePreview=false;
  analysis.extraction={method:'current-rule-engine-demo',pages:1,confidence:1};
  res.json(analysis);
});

app.get('/api/config', (_req, res) => {
  res.json({
    paystackPublicKey: store.durable() ? PAYSTACK_PUBLIC : '',
    prices: PRICES,
    maxFileMb: MAX_FILE_MB,
    jurisdictions: ['ZA', 'UK'],
  });
});

app.post('/api/events', eventLimiter, async (req, res, next) => {
  try {
  const { name, props } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name required' });
  await store.track(name.slice(0, 64), typeof props === 'object' && props ? props : {});
  res.json({ ok: true });
  } catch(e) {next(e);}
});

app.get('/api/metrics', (_req,res)=>res.status(403).json({error:'Private endpoint'}));
app.get('/api/credits', async (req,res,next)=> {
  try {
    const ref=String(req.headers['x-payment-reference']||'');
    if(!ref) return res.status(401).json({error:'Payment receipt required'});
    const grant=await store.getGrant(ref);
    if(!grant) return res.status(404).json({error:'Receipt not found'});
    res.json({credits:grant.remaining});
  } catch(e) {next(e);}
});
app.post('/api/verify-payment', payLimiter, async (req,res,next)=> {
  try {
    const {reference,email,product}=req.body||{};
    if(typeof reference!=='string'||!/^CC-[A-Za-z0-9-]{10,100}$/.test(reference)) return res.status(400).json({error:'Invalid payment reference'});
    if(!store.durable()) return res.status(503).json({error:'Payments unavailable until private storage is connected'});
    const body=await verifyPaystack(reference); const data=body.data||{};
    if(data.status!=='success') return res.status(402).json({error:'Payment not successful'});
    const purchased=data.metadata?.product;
    if(!Object.hasOwn(PRICES,purchased)||product!==purchased||Number(data.amount)!==PRICES[purchased]||data.currency!=='ZAR') return res.status(402).json({error:'Payment product, currency or amount mismatch'});
    const customer=String(data.customer?.email||'').toLowerCase().trim();
    if(!customer||String(email||'').toLowerCase().trim()!==customer) return res.status(403).json({error:'Receipt email mismatch'});
    const grant=await store.saveGrant(reference,{email:customer,product:purchased,amount:Number(data.amount),credits:purchased==='pack10'?10:purchased==='pack3'?3:1});
    await store.track('payment_verified',{product:purchased,amount:Number(data.amount)});
    res.json({ok:true,grantId:reference,product:purchased,credits:grant.remaining,email:customer,amount:Number(data.amount)});
  } catch(e) {next(e);}
});

app.post('/api/analyze', uploadLimiter, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const extracted = await extractText(file);
    cleanup(file.path);

    if (!extracted.text || extracted.text.length < 30) {
      return res.status(422).json({
        error: 'Could not extract enough text from this file.',
        hint: extracted.warning || 'Try a text PDF or a clear photo (PNG/JPG).',
        method: extracted.method,
      });
    }

    const jurisdiction = String(req.body?.jurisdiction || req.query.jurisdiction || 'ZA').toUpperCase();
    if (!['ZA','UK'].includes(jurisdiction)) return res.status(400).json({error:'Choose South Africa (ZA) or United Kingdom (UK).'});
    let analysis = analyseContract(extracted.text, file.originalname || 'document', jurisdiction);
    analysis.extraction = {
      method: extracted.method,
      pages: extracted.pages,
      confidence: extracted.confidence,
      warning: extracted.warning || null,
      chars: extracted.text.length,
    };
    analysis._id = `scan-${Date.now()}-${uuidv4()}`;
    analysis.isPaid = false;

    if (req.body?.enrich === '1' || req.query.enrich === '1') {
      analysis = await enrichWithLLM(analysis, extracted.text);
    }

    await store.saveAnalysis(analysis._id, analysis);
    await store.track('analyze_complete', {
      jurisdiction,
      method: extracted.method,
      issues: analysis.issuesCount,
      score: analysis.score,
    });

    res.json(freeViewOf(analysis));
  } catch (err) {
    cleanup(file?.path);
    const status = Number(err?.status) || 422;
    if (status >= 500) console.error('analyze', err);
    res.status(status).json({ error: err?.status ? err.message : 'This file could not be read. Try an unlocked PDF, plain text file or a clear photo.' });
  }
});

app.post('/api/analyze-text', uploadLimiter, async (req, res, next) => {
  try {
  const text = req.body?.text || '';
  const name = req.body?.fileName || 'document';
  const jurisdiction = String(req.body?.jurisdiction || 'ZA').toUpperCase();
  if (!['ZA','UK'].includes(jurisdiction)) return res.status(400).json({error:'Choose South Africa (ZA) or United Kingdom (UK).'});
  if (typeof text !== 'string' || text.length < 30 || text.length > 200000) return res.status(400).json({ error: 'Text too short' });

  const analysis = analyseContract(text, name, jurisdiction);
  analysis._id = `local-${Date.now()}-${uuidv4()}`;
  analysis.extraction = { method: 'client-text', pages: 1, confidence: 1 };
  analysis.isPaid = false;
  await store.saveAnalysis(analysis._id, analysis);
  await store.track('analyze_text', { jurisdiction, issues: analysis.issuesCount, score: analysis.score });
  res.json(freeViewOf(analysis));
  } catch(e) {next(e);}
});

app.post('/api/unlock-analysis', payLimiter, async (req,res,next)=> {
  try {
    const {analysisId,reference,grantId,email}=req.body||{};
    if(typeof analysisId!=='string'||!analysisId) return res.status(400).json({error:'Missing analysisId'});
    const stored=await store.getAnalysis(analysisId);
    if(!stored?.full) return res.status(404).json({error:'Analysis expired. Please scan again.'});
    const ref=reference||grantId;
    if(typeof ref!=='string'||ref==='credit') return res.status(402).json({error:'Payment receipt required'});
    const existing=await store.getGrant(ref);
    if(!existing||existing.email!==String(email||'').toLowerCase().trim()) return res.status(403).json({error:'Valid payment receipt and email required'});
    const grant=await store.useCredit(ref,analysisId);
    if(!grant) return res.status(402).json({error:'No report credits remaining'});
    await store.track('unlock_success',{via:'verified_credit'});
    res.json({...stored.full,isPaid:true,unlockedVia:'payment',credits:grant.remaining});
  } catch(e) {next(e);}
});
app.get('/api/cleanup',async(req,res,next)=> {
  if(!process.env.CRON_SECRET||req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();
  try {await store.cleanupExpired();res.json({ok:true});} catch(e){next(e);}
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: err.code === 'LIMIT_FILE_SIZE' ? `File too large (max ${MAX_FILE_MB}MB)` : err.message,
    });
  }
  console.error(err);
  res.status(err.status||500).json({ error: err.message || 'Server error' });
});

if (require.main === module) app.listen(PORT, () => {
  console.log(`ContractCheck v3 on http://localhost:${PORT}`);
  console.log(`Paystack: ${PAYSTACK_SECRET ? 'live secret set' : 'OFF'}`);
  console.log(`Groq: ${process.env.GROQ_API_KEY ? 'on' : 'off'} | TinyFish: ${process.env.TINYFISH_API_KEY ? 'on' : 'off'}`);
});

module.exports = app;
