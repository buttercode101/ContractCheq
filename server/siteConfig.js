const SITE_ORIGIN = 'https://contractcheck.online';
const SITE_HOST = new URL(SITE_ORIGIN).hostname;

// Keep local development usable. On Vercel only the canonical Host may serve
// the app; forwarded headers are not authority for this decision.
function canonicalHost(req, res, next) {
  if (!process.env.VERCEL || String(req.headers.host || '').toLowerCase() === SITE_HOST) return next();
  // Vercel Cron can call a generated deployment URL. This is a private
  // maintenance endpoint, never a second public entry point to the product.
  if (req.method === 'GET' && req.path === '/api/cleanup' && process.env.CRON_SECRET &&
      req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return next();
  return res.status(404).set({'Cache-Control':'no-store','X-Robots-Tag':'noindex'}).end();
}

// Static files bypass Express in production, so enforce the same policy at
// the edge. The cleanup endpoint still passes through the server guard above.
const hostRoutes = [
  {src:'/api/cleanup', dest:'/api/index'},
  {src:'/.*', missing:[{type:'host',value:'^'+SITE_HOST.replace(/\./g,'\\.')+'$'}], status:404,
    headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}}
];

module.exports = {SITE_ORIGIN, SITE_HOST, canonicalHost, hostRoutes};
