const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('browser application script parses before deployment',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'..','public','index.html'),'utf8');
  const chunks=html.split('<script>');
  assert.ok(chunks.length>1,'expected inline application script');
  const script=chunks[chunks.length-1].split('</script>')[0];
  assert.ok(script.trim().length>100,'expected application script body');
  new vm.Script(script,{filename:'public/index.html'});
});
