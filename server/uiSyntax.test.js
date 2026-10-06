const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('browser application script parses before deployment',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'..','public','index.html'),'utf8');
  const scripts=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
  assert.ok(scripts.length,'expected inline application script');
  for(const script of scripts) new vm.Script(script,{filename:'public/index.html'});
});
