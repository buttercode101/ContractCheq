import crypto from 'node:crypto';

export const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || 'dev';

export function requestIdFrom(req) {
  return req.headers['x-request-id'] || crypto.randomUUID();
}

export function sendJson(res, status, payload, reqId) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('x-contractcheck-version', APP_VERSION);
  if (reqId) res.setHeader('x-request-id', reqId);
  res.end(JSON.stringify(payload));
}

export function makeError(code, message, details) {
  return {
    ok: false,
    error: { code, message, details: details || null }
  };
}

export function makeSuccess(data, reqId) {
  return {
    ok: true,
    requestId: reqId,
    version: APP_VERSION,
    ...data
  };
}
