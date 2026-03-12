import { AnalysisResult } from '../types';

async function parseResponseJsonSafe(resp: Response): Promise<any> {
  const raw = await resp.text();

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const sample = raw.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`API returned non-JSON response (status ${resp.status}). Sample: ${sample}`);
  }
}

function extractErrorMessage(payload: any, fallback: string): string {
  const code = payload?.error?.code;
  const msg = payload?.error?.message || payload?.error || fallback;
  return code ? `[${code}] ${msg}` : msg;
}

export async function extractTextWithOCR(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const resp = await fetch('/api/extract-text', {
    method: 'POST',
    body: form
  });

  const data = await parseResponseJsonSafe(resp);
  if (!resp.ok || data?.ok === false) throw new Error(extractErrorMessage(data, 'OCR extraction failed.'));
  return data.text as string;
}

export async function analyzeContractText(text: string): Promise<AnalysisResult> {
  const resp = await fetch('/api/analyze-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const data = await parseResponseJsonSafe(resp);
  if (!resp.ok || data?.ok === false) throw new Error(extractErrorMessage(data, 'Text analysis failed.'));
  return data.analysis as AnalysisResult;
}

export async function fetchApiVersion(): Promise<string> {
  try {
    const resp = await fetch('/api/version');
    const data = await parseResponseJsonSafe(resp);
    if (resp.ok && data?.version) return data.version;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}
