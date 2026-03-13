import { createServer } from 'node:http';
import { APP_VERSION, makeError, makeSuccess, requestIdFrom, sendJson } from './lib/apiUtils.js';
import { MAX_FILE_SIZE_BYTES } from './lib/documentFlow.js';
import { callGroqAnalyze, ocrSpaceExtract } from './lib/providerClient.js';

const PORT = Number(process.env.API_PORT || 8787);


let analyzeQueue = Promise.resolve();

function queueAnalyze(task) {
  const run = analyzeQueue.then(task, task);
  analyzeQueue = run.catch(() => undefined);
  return run;
}

const SYSTEM_PROMPT = `You are a senior South African attorney with 20+ years of experience in consumer, employment, rental housing, and data protection law. You ONLY analyse contracts under current South African statutes and case law as of March 2026. You NEVER hallucinate clauses, cases, or interpretations that do not exist. If something is unclear, ambiguous, or outside your knowledge, state "INSUFFICIENT EVIDENCE – REQUIRES HUMAN REVIEW" instead of guessing.
Output JSON only.`;

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

async function parseMultipartForm(req) {
  const request = new Request('http://localhost/upload', {
    method: req.method,
    headers: req.headers,
    body: req,
    duplex: 'half'
  });
  return request.formData();
}

const server = createServer(async (req, res) => {
  const reqId = requestIdFrom(req);
  if (req.method === 'OPTIONS') return sendJson(res, 200, makeSuccess({ ok: true }, reqId), reqId);

  try {
    if (req.url === '/api/version') {
      return sendJson(res, 200, makeSuccess({ version: APP_VERSION, service: 'contractcheck-api' }, reqId), reqId);
    }

    if (req.url === '/api/health') {
      return sendJson(
        res,
        200,
        makeSuccess({
          healthy: true,
          env: {
            OCR_SPACE_API_KEY: Boolean(process.env.OCR_SPACE_API_KEY),
            GROQ_API_KEY: Boolean(process.env.GROQ_API_KEY)
          }
        }, reqId),
        reqId
      );
    }

    if (req.url === '/api/extract-text') {
      if (req.method === 'GET') return sendJson(res, 200, makeSuccess({ healthy: true, service: 'extract-text' }, reqId), reqId);
      if (req.method !== 'POST') return sendJson(res, 405, makeError('METHOD_NOT_ALLOWED', 'Method not allowed.'), reqId);

      const formData = await parseMultipartForm(req);
      const file = formData.get('file');
      if (!(file instanceof File)) {
        return sendJson(res, 400, makeError('INVALID_INPUT', 'File upload required.'), reqId);
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return sendJson(res, 400, makeError('FILE_TOO_LARGE', `File too large. Max is ${Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB.`), reqId);
      }

      const text = await ocrSpaceExtract(file, process.env.OCR_SPACE_API_KEY);
      return sendJson(res, 200, makeSuccess({ text, source: 'ocr_space' }, reqId), reqId);
    }

    if (req.url === '/api/analyze-text') {
      if (req.method === 'GET') return sendJson(res, 200, makeSuccess({ healthy: true, service: 'analyze-text' }, reqId), reqId);
      if (req.method !== 'POST') return sendJson(res, 405, makeError('METHOD_NOT_ALLOWED', 'Method not allowed.'), reqId);

      const body = await readJsonBody(req);
      const text = String(body.text || '').trim();
      if (!text) return sendJson(res, 400, makeError('INVALID_INPUT', 'text is required.'), reqId);

      const analysis = await queueAnalyze(() => callGroqAnalyze(text, process.env.GROQ_API_KEY, { systemPrompt: SYSTEM_PROMPT }));
      return sendJson(res, 200, makeSuccess({ analysis }, reqId), reqId);
    }

    return sendJson(res, 404, makeError('NOT_FOUND', 'Not found.'), reqId);
  } catch (err) {
    const code = err?.code || 'INTERNAL_ERROR';
    return sendJson(res, 500, makeError(code, err instanceof Error ? err.message : 'Internal server error', { version: APP_VERSION }), reqId);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on http://0.0.0.0:${PORT} (version ${APP_VERSION})`);
});
