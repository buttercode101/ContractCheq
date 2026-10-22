const DEFAULT_MODEL='deepseek/deepseek-v4-flash';
const on=value=>['1','true','yes','on'].includes(String(value||'').trim().toLowerCase());
function aiPolicy(env=process.env){
 const openrouter=Boolean(String(env.OPENROUTER_API_KEY||'').trim());
 const groq=on(env.AI_ALLOW_GROQ_FALLBACK)&&Boolean(String(env.GROQ_API_KEY||'').trim());
 const requested=on(env.AI_ENRICHMENT_ENABLED),configured=openrouter||groq;
 const limit=Number(env.AI_ENRICHMENT_MAX_CHARS);
 return {enabled:requested&&configured,configured,requested,provider:openrouter?'openrouter':groq?'groq':'none',groqFallback:groq,
  research:on(env.AI_RESEARCH_ENABLED)&&Boolean(String(env.TINYFISH_API_KEY||'').trim()),
  model:String(env.OPENROUTER_MODEL||DEFAULT_MODEL).trim()||DEFAULT_MODEL,
  maxChars:Number.isFinite(limit)&&limit>0?Math.max(200,Math.min(4000,Math.floor(limit))):4000};
}
function openrouterBody(messages,model=DEFAULT_MODEL){
 return {model,messages,temperature:0.2,max_tokens:1600,response_format:{type:'json_object'},reasoning:{enabled:false},
  provider:{sort:'price',require_parameters:true,data_collection:'deny',zdr:true,max_price:{prompt:0.10,completion:0.30,request:0}}};
}
module.exports={DEFAULT_MODEL,aiPolicy,openrouterBody};
