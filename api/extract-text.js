export const config = {
  runtime: 'nodejs'
};

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function parseMultipartForm(req) {
  const request = new Request('http://localhost/api/extract-text', {
    method: req.method,
    headers: req.headers,
    body: req,
    duplex: 'half'
  });
  return request.formData();
}

async function ocrSpaceExtract(file) {
  const key = process.env.OCR_SPACE_API_KEY;
  if (!key) throw new Error('OCR_SPACE_API_KEY is missing in server environment.');

  const form = new FormData();
  form.append('apikey', key);
  form.append('language', 'eng');
  form.append('isOverlayRequired', 'false');
  form.append('OCREngine', '2');
  form.append('isCreateSearchablePdf', 'false');
  form.append('file', file, file.name || 'upload.bin');

  const resp = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: form
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OCR.Space request failed (${resp.status}): ${text.slice(0, 160)}`);
  }

  const json = await resp.json();
  if (json.IsErroredOnProcessing) {
    const msg = json.ErrorMessage?.join(' ') || json.ErrorDetails || 'OCR failed.';
    throw new Error(`OCR.Space error: ${msg}`);
  }

  const text = (json.ParsedResults || []).map((r) => r.ParsedText || '').join('\n').trim();
  if (!text) throw new Error('OCR returned no text. Use a clearer image/PDF scan.');
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    const formData = await parseMultipartForm(req);
    const file = formData.get('file');
    if (!(file instanceof File)) return send(res, 400, { error: 'File upload required.' });

    const text = await ocrSpaceExtract(file);
    return send(res, 200, { text, source: 'ocr_space' });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : 'Internal server error' });
  }
}
