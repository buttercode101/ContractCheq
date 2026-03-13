import { APP_VERSION, makeSuccess, requestIdFrom, sendJson } from '../lib/apiUtils.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const reqId = requestIdFrom(req);
  return sendJson(res, 200, makeSuccess({ version: APP_VERSION, service: 'contractcheck-api' }, reqId), reqId);
}
