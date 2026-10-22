const test=require('node:test'),assert=require('node:assert/strict');
const {aiPolicy,openrouterBody}=require('./aiPolicy');
test('AI enablement needs a configured provider and does not silently switch to Groq',()=>{
 assert.equal(aiPolicy({AI_ENRICHMENT_ENABLED:'true',GROQ_API_KEY:'configured'}).enabled,false);
 assert.equal(aiPolicy({AI_ENRICHMENT_ENABLED:'true',OPENROUTER_API_KEY:'   '}).configured,false);
 assert.equal(aiPolicy({OPENROUTER_API_KEY:'configured'}).enabled,false);
 const enabled=aiPolicy({AI_ENRICHMENT_ENABLED:'true',OPENROUTER_API_KEY:'configured'});assert.equal(enabled.enabled,true);assert.equal(enabled.provider,'openrouter');assert.equal(enabled.groqFallback,false);assert.equal(enabled.research,false);
 const fallback=aiPolicy({AI_ENRICHMENT_ENABLED:'true',AI_ALLOW_GROQ_FALLBACK:'true',GROQ_API_KEY:'configured'});assert.equal(fallback.enabled,true);assert.equal(fallback.provider,'groq');
 assert.equal(aiPolicy({AI_RESEARCH_ENABLED:'true'}).research,false);
});
test('invalid excerpt limits cannot expand document disclosure beyond 4000 characters',()=>{
 for(const value of ['-1','0','NaN','Infinity','999999999'])assert.equal(aiPolicy({AI_ENRICHMENT_MAX_CHARS:value}).maxChars,4000);
 assert.equal(aiPolicy({AI_ENRICHMENT_MAX_CHARS:'2000'}).maxChars,2000);assert.equal(aiPolicy({AI_ENRICHMENT_MAX_CHARS:'0.5'}).maxChars,200);
 const request=openrouterBody([]);assert.equal(request.model,'deepseek/deepseek-v4-flash');assert.equal(request.provider.zdr,true);assert.equal(request.provider.data_collection,'deny');assert.equal(request.provider.require_parameters,true);assert.equal(request.reasoning.enabled,false);
});
