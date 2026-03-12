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

export async function extractTextWithOCR(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const resp = await fetch('/api/extract-text', {
    method: 'POST',
    body: form
  });

  const data = await parseResponseJsonSafe(resp);
  if (!resp.ok) throw new Error(data.error || 'OCR extraction failed.');
  return data.text as string;
}

export async function analyzeContractText(text: string): Promise<AnalysisResult> {
  const resp = await fetch('/api/analyze-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const data = await parseResponseJsonSafe(resp);
  if (!resp.ok) throw new Error(data.error || 'Text analysis failed.');
  return data.analysis as AnalysisResult;
}
