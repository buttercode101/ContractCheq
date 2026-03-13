import { APP_VERSION, makeSuccess, requestIdFrom, sendJson } from '../lib/apiUtils.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const reqId = requestIdFrom(req);
  const env = {
    OCR_SPACE_API_KEY: Boolean(process.env.OCR_SPACE_API_KEY),
    GROQ_API_KEY: Boolean(process.env.GROQ_API_KEY)
  };

  return sendJson(
    res,
    200,
    makeSuccess({
      service: 'contractcheck-api',
      version: APP_VERSION,
      env,
      healthy: true
    }, reqId),
    reqId
  );
}
