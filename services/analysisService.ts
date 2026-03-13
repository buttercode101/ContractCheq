import { AnalysisResult } from '../types';

export class ApiClientError extends Error {
  code?: string;
  requestId?: string;
  version?: string;

  constructor(message: string, meta?: { code?: string; requestId?: string; version?: string }) {
    super(message);
    this.name = 'ApiClientError';
    this.code = meta?.code;
    this.requestId = meta?.requestId;
    this.version = meta?.version;
  }
}

let requestQueue: Promise<any> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(task, task);
  requestQueue = run.catch(() => undefined);
  return run;
}

async function parseResponseJsonSafe(resp: Response): Promise<any> {
  const raw = await resp.text();

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const sample = raw.slice(0, 120).replace(/\s+/g, ' ');
    throw new ApiClientError(`API returned non-JSON response (status ${resp.status}). Sample: ${sample}`);
  }
}

function throwApiError(payload: any, fallback: string): never {
  const code = payload?.error?.code;
  const msg = payload?.error?.message || payload?.error || fallback;
  throw new ApiClientError(code ? `[${code}] ${msg}` : msg, {
    code,
    requestId: payload?.requestId,
    version: payload?.version || payload?.error?.details?.version
  });
}

export async function extractTextWithOCR(file: File): Promise<string> {
  return enqueue(async () => {
    const form = new FormData();
    form.append('file', file);

    const resp = await fetch('/api/extract-text', {
      method: 'POST',
      body: form
    });

    const data = await parseResponseJsonSafe(resp);
    if (!resp.ok || data?.ok === false) throwApiError(data, 'OCR extraction failed.');
    return data.text as string;
  });
}

export async function analyzeContractText(text: string): Promise<{ analysis: AnalysisResult; requestId?: string; version?: string }> {
  return enqueue(async () => {
    const resp = await fetch('/api/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await parseResponseJsonSafe(resp);
    if (!resp.ok || data?.ok === false) throwApiError(data, 'Text analysis failed.');
    return { analysis: data.analysis as AnalysisResult, requestId: data.requestId, version: data.version };
  });
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
