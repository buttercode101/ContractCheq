const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-ai-readiness-'));
process.env.AI_ENRICHMENT_ENABLED='true';process.env.GROQ_API_KEY='test-only';process.env.TINYFISH_API_KEY='test-only';
const app=require('./index');
test('an enabled flag without the requested provider keeps UI disabled and forced consent requests local',async()=>{
 const realFetch=global.fetch;let providerCalls=0;
 global.fetch=(url,options)=>{providerCalls++;throw Error('External providers must not be called');};
 const server=app.listen(0);await new Promise(r=>server.once('listening',r));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const config=await realFetch(base+'/api/config').then(r=>r.json());assert.equal(config.aiEnrichmentEnabled,false);assert.equal(config.llmProvider,'none');
  const health=await realFetch(base+'/api/health').then(r=>r.json());assert.equal(health.ai_configured,false);assert.equal(health.ai_enrichment,false);assert.equal(health.ai_model,'deepseek/deepseek-v4-flash');
  const form=new FormData();form.set('file',new Blob(['RESIDENTIAL LEASE. Landlord may enter the dwelling without notice.'],{type:'text/plain'}),'local-only.txt');form.set('enrich','1');
  const response=await realFetch(base+'/api/analyze',{method:'POST',body:form});assert.equal(response.status,200);const report=await response.json();assert.equal(report.aiStatus,'disabled');assert.equal(report.llmEnriched,false);assert.equal(providerCalls,0);
 }finally{global.fetch=realFetch;server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
