const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
let cached;
function securityHeaders() {
  if(cached)return cached;
  // Hash the exact shipped inline program. Arbitrary injected scripts remain blocked.
  const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
  const hashes=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>"'sha256-"+crypto.createHash('sha256').update(m[1]).digest('base64')+"'");
  const policy=[
    "default-src 'self'", "script-src 'self' "+hashes.join(' ')+" https://js.paystack.co https://*.paystack.co https://*.paystack.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.paystack.co https://*.paystack.com", "connect-src 'self' https://*.paystack.co https://*.paystack.com",
    "frame-src https://*.paystack.co https://*.paystack.com", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'self'"
  ].join('; ');
  return cached={'Content-Security-Policy':policy,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'};
}
module.exports={securityHeaders};
