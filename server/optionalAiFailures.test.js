const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-ai-failure-'));process.env.AI_ENRICHMENT_ENABLED='true';process.env.OPENROUTER_API_KEY='test-only';process.env.GROQ_API_KEY='test-only';process.env.TINYFISH_API_KEY='test-only';
const app=require('./index');
test('provider rejection, malformed and truncated responses keep the rules report without extra providers or content logs',async()=>{
 const realFetch=global.fetch,realWarn=console.warn,calls=[],warnings=[];let mode='http';
 const text='RESIDENTIAL LEASE. The landlord may enter the dwelling without notice. The tenant shall pay R8000 each month.';
 global.fetch=async(url,options)=>{calls.push(String(url));assert.equal(String(url),'https://openrouter.ai/api/v1/chat/completions');
  if(mode==='http')return {ok:false,status:503};
  if(mode==='malformed')return {ok:true,json:async()=>({choices:[{message:{content:'PRIVATE-AI-CONTENT-CANARY'}}]})};
  if(mode==='structure')return {ok:true,json:async()=>({choices:[{message:{content:'{"summaryNote":"not a valid review"}'}}]})};
  return {ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:'{"extraIssues":[]}'}}]})};
 };
 console.warn=(...args)=>warnings.push(args);
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const scan=async()=>{const form=new FormData();form.set('file',new Blob([text],{type:'text/plain'}),'lease.txt');form.set('enrich','1');const response=await realFetch(base+'/api/analyze',{method:'POST',body:form});assert.equal(response.status,200);return response.json();};
  for(mode of ['http','malformed','structure','truncated']){const before=calls.length,result=await scan();assert.equal(result.llmEnriched,false);assert.equal(result.aiStatus,'unavailable');assert.ok(result.issues.some(i=>i.id.startsWith('rha-entry')));assert.equal(calls.length,before+1);assert.equal(result.plainLanguageGuide,undefined);}
  assert.ok(!JSON.stringify(warnings).includes('PRIVATE-AI-CONTENT-CANARY'));
 }finally{global.fetch=realFetch;console.warn=realWarn;server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
