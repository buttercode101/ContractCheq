const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(),'contractcheck-host-tests-'));
const app = require('./index');
const store = require('./store');
const {SITE_HOST, SITE_ORIGIN, hostRoutes} = require('./siteConfig');

test('production serves only the canonical host, including APIs and spoofed forwarding headers', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening',resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  // Node's fetch may rewrite Host. Exercise the real HTTP authority explicitly.
  const fetch = (url, options={}) => new Promise((resolve,reject) => {
    const request = http.request(url, options, response => {
      const chunks=[];
      response.on('data',chunk=>chunks.push(chunk));
      response.on('end',()=>resolve({status:response.statusCode,
        headers:{get:name=>response.headers[name.toLowerCase()]},
        text:async()=>Buffer.concat(chunks).toString()}));
    });
    request.on('error',reject);
    request.end();
  });
  const cleanup = store.cleanupExpired;
  let cleaned = 0;
  store.cleanupExpired = async () => { cleaned++; };
  process.env.VERCEL='1';
  process.env.CRON_SECRET='test-only-cleanup-secret';
  try {
    for (const host of [SITE_HOST, SITE_HOST.toUpperCase()]) {
      for (const route of ['/', '/api/config', '/api/demo/lease', '/app.css']) {
        assert.equal((await fetch(base+route,{headers:{host}})).status,200,host+route);
      }
    }
    for (const host of ['www.contractcheck.online','contractcheck-sa-v3.vercel.app','contract-check-v3-sa.vercel.app',
      'contractcheck.online.attacker.test','evilcontractcheck.online','localhost:3000']) {
      for (const route of ['/', '/api/config', '/api/demo/lease', '/app.css','/api/cleanup','/api/cleanup?test=1']) {
        const r = await fetch(base+route,{headers:{host,'x-forwarded-host':SITE_HOST}});
        assert.equal(r.status,404,host+route);
        assert.equal(await r.text(),'');
        assert.equal(r.headers.get('cache-control'),'no-store');
      }
    }
    const operational = {host:'generated.vercel.app',authorization:'Bearer test-only-cleanup-secret'};
    assert.equal((await fetch(base+'/api/cleanup',{headers:operational})).status,200);
    assert.equal(cleaned,1);
    assert.equal((await fetch(base+'/',{headers:operational})).status,404);
    assert.equal((await fetch(base+'/api/cleanup',{method:'POST',headers:operational})).status,404);
    assert.equal((await fetch(base+'/api/cleanup',{headers:{...operational,authorization:'Bearer wrong'}})).status,404);
    assert.equal(cleaned,1);
    assert.equal((await fetch(base+'/api/cleanup',{headers:{host:SITE_HOST}})).status,401);
    delete process.env.CRON_SECRET;
    assert.equal((await fetch(base+'/api/cleanup',{headers:operational})).status,404);
    delete process.env.VERCEL;
    assert.equal((await fetch(base+'/api/config')).status,200,'local development must remain usable');
  } finally {
    delete process.env.VERCEL;
    delete process.env.CRON_SECRET;
    store.cleanupExpired=cleanup;
    server.close();
    fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});
  }
});

test('edge host matching excludes suffix attacks and only exempts authenticated maintenance routing', () => {
  assert.deepEqual(hostRoutes[0],{src:'/api/cleanup',dest:'/api/index'});
  const rule = hostRoutes[1];
  const matcher = new RegExp(rule.missing[0].value);
  assert.equal(matcher.test(SITE_HOST),true);
  for (const host of ['www.'+SITE_HOST, SITE_HOST+'.evil.test','evil'+SITE_HOST,'generated.vercel.app']) {
    assert.equal(matcher.test(host),false,host);
  }
  assert.deepEqual(rule.mitigate,{action:'deny'});
  assert.equal(SITE_ORIGIN,'https://'+SITE_HOST);
});
