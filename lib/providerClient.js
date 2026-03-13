import { isValidAnalysisShape, normalizeAnalysisShape } from './analysisNormalizer.js';

function extractFirstJsonObject(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return null;

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    try { return JSON.parse(fenceMatch[1]); } catch {}
  }

  try { return JSON.parse(cleaned); } catch {}

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const sliced = cleaned.slice(start, end + 1);
    try { return JSON.parse(sliced); } catch {}
  }

  return null;
}

export async function ocrSpaceExtract(file, apiKey) {
  if (!apiKey) throw new Error('OCR_SPACE_API_KEY is missing in server environment.');

  const form = new FormData();
  form.append('apikey', apiKey);
  form.append('language', 'eng');
  form.append('isOverlayRequired', 'false');
  form.append('OCREngine', '2');
  form.append('isCreateSearchablePdf', 'false');
  form.append('file', file, file.name || 'upload.bin');

  const resp = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form });

  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(`OCR.Space request failed (${resp.status}): ${text.slice(0, 160)}`);
    err.code = 'OCR_PROVIDER_HTTP_ERROR';
    throw err;
  }

  const json = await resp.json();
  if (json.IsErroredOnProcessing) {
    const msg = json.ErrorMessage?.join(' ') || json.ErrorDetails || 'OCR failed.';
    const err = new Error(`OCR.Space error: ${msg}`);
    err.code = 'OCR_PROVIDER_PROCESSING_ERROR';
    throw err;
  }

  const text = (json.ParsedResults || []).map((r) => r.ParsedText || '').join('\n').trim();
  if (!text) {
    const err = new Error('OCR returned no text. Use a clearer image/PDF scan.');
    err.code = 'OCR_EMPTY_TEXT';
    throw err;
  }

  return text;
}

export async function callGroqAnalyze(text, apiKey, options = {}) {
  const retry = Boolean(options.retry);
  if (!apiKey) throw new Error('GROQ_API_KEY is missing in server environment.');

  const userPrompt = `Analyze this contract and return JSON only using fields: overall_risk, overallRiskScore, overall_summary, financial_exposure_estimate, risks. Contract:\n---\n${text.slice(0, 32000)}\n---`;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: options.systemPrompt || 'Return only valid JSON.' },
        { role: 'user', content: userPrompt + (retry ? '\nIMPORTANT: Return strictly valid JSON only.' : '') }
      ]
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    const err = new Error(`Groq request failed (${resp.status}): ${errText.slice(0, 180)}`);
    err.code = resp.status === 429 ? 'GROQ_RATE_LIMIT' : 'GROQ_HTTP_ERROR';
    throw err;
  }

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error('Groq returned empty content.');
    err.code = 'GROQ_EMPTY_CONTENT';
    throw err;
  }

  const parsed = extractFirstJsonObject(content);
  if (!parsed) {
    if (!retry) return callGroqAnalyze(text, apiKey, { ...options, retry: true });
    const err = new Error('Groq returned invalid JSON after retry.');
    err.code = 'GROQ_INVALID_JSON';
    throw err;
  }

  const normalized = normalizeAnalysisShape(parsed);
  if (!isValidAnalysisShape(normalized)) {
    if (!retry) return callGroqAnalyze(text, apiKey, { ...options, retry: true });
    const err = new Error('Groq response could not be normalized to required schema.');
    err.code = 'ANALYSIS_SCHEMA_FAIL';
    throw err;
  }

  return normalized;
}
