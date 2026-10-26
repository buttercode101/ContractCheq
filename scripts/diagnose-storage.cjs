#!/usr/bin/env node
/*
 * Storage diagnostic for ContractCheck.
 *
 * Run this on any machine where the production storage credentials are available
 * (or against a deployment via GET /api/health/storage). It performs a real
 * write -> read-back -> delete round trip, because the presence of
 * BLOB_READ_WRITE_TOKEN only proves that a variable is set, not that storage works.
 *
 * It never prints credential values.
 */
require('dotenv').config();
const store = require('../server/store');

(async () => {
  const probe = await store.probeStorage();
  const report = {
    node: process.version,
    vercelRuntime: Boolean(process.env.VERCEL),
    storageConfigured: store.durable(),
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasStoreId: Boolean(process.env.BLOB_STORE_ID),
    writable: probe.writable,
    error: probe.error,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!probe.writable) {
    console.error('\nStorage is NOT writable. Every analysis save will fail with a 500 and the');
    console.error('product cannot complete its primary journey. Check the private Blob store in');
    console.error('the Vercel dashboard: a suspended store or a revoked/rotated token still looks');
    console.error('configured to the application.');
  }
  process.exit(probe.writable ? 0 : 1);
})().catch(error => {
  console.error('Diagnostic failed: ' + String((error && error.message) || error));
  process.exit(2);
});
