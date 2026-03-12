import { AnalysisResult } from '../types';

export async function extractTextWithOCR(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);

  const resp = await fetch('/api/extract-text', {
    method: 'POST',
    body: form
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'OCR extraction failed.');
  return data.text as string;
}

export async function analyzeContractText(text: string): Promise<AnalysisResult> {
  const resp = await fetch('/api/analyze-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Text analysis failed.');
  return data.analysis as AnalysisResult;
}
