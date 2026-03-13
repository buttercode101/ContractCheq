import { APP_VERSION, makeError, makeSuccess, requestIdFrom, sendJson } from '../lib/apiUtils.js';
import { MAX_FILE_SIZE_BYTES } from '../lib/documentFlow.js';
import { ocrSpaceExtract } from '../lib/providerClient.js';

export const config = {
  runtime: 'nodejs'
};

async function parseMultipartForm(req) {
  const request = new Request('http://localhost/api/extract-text', {
    method: req.method,
    headers: req.headers,
    body: req,
    duplex: 'half'
  });
  return request.formData();
}

export default async function handler(req, res) {
  const reqId = requestIdFrom(req);

  if (req.method === 'GET') {
    return sendJson(res, 200, makeSuccess({ healthy: true, service: 'extract-text' }, reqId), reqId);
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, makeError('METHOD_NOT_ALLOWED', 'Method not allowed.'), reqId);
  }

  try {
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
  } catch (error) {
    const code = error?.code || 'OCR_INTERNAL_ERROR';
    return sendJson(
      res,
      500,
      makeError(code, error instanceof Error ? error.message : 'Internal server error', { version: APP_VERSION }),
      reqId
    );
  }
}
