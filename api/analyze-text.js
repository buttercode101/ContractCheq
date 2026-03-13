import { callGroqAnalyze } from '../lib/providerClient.js';
import { APP_VERSION, makeError, makeSuccess, requestIdFrom, sendJson } from '../lib/apiUtils.js';

export const config = {
  runtime: 'nodejs'
};


let analyzeQueue = Promise.resolve();

function queueAnalyze(task) {
  const run = analyzeQueue.then(task, task);
  analyzeQueue = run.catch(() => undefined);
  return run;
}

const SYSTEM_PROMPT = `You are a senior South African attorney with 20+ years of experience in consumer, employment, rental housing, and data protection law. You ONLY analyse contracts under current South African statutes and case law as of March 2026. You NEVER hallucinate clauses, cases, or interpretations that do not exist. If something is unclear, ambiguous, or outside your knowledge, state "INSUFFICIENT EVIDENCE – REQUIRES HUMAN REVIEW" instead of guessing.

Your sole task is to perform a clause-by-clause risk audit on the provided contract text. Follow these strict rules:

1. Identify EVERY potentially unfair, unlawful, risky, missing, or ambiguous clause.
2. Reference ONLY real, current SA law.
3. For EVERY flagged item include quote, risk score, level, reason, action, and act reference.
4. Output JSON ONLY.`;

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

export default async function handler(req, res) {
  const reqId = requestIdFrom(req);

  if (req.method === 'GET') {
    return sendJson(res, 200, makeSuccess({ healthy: true, service: 'analyze-text' }, reqId), reqId);
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, makeError('METHOD_NOT_ALLOWED', 'Method not allowed.'), reqId);
  }

  try {
    const body = await readJsonBody(req);
    const text = String(body.text || '').trim();
    if (!text) {
      return sendJson(res, 400, makeError('INVALID_INPUT', 'text is required.'), reqId);
    }

    const analysis = await queueAnalyze(() => callGroqAnalyze(text, process.env.GROQ_API_KEY, { systemPrompt: SYSTEM_PROMPT }));
    return sendJson(res, 200, makeSuccess({ analysis }, reqId), reqId);
  } catch (error) {
    const code = error?.code || 'ANALYSIS_INTERNAL_ERROR';
    return sendJson(
      res,
      500,
      makeError(code, error instanceof Error ? error.message : 'Internal server error', { version: APP_VERSION }),
      reqId
    );
  }
}
