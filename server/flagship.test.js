const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const React=require('react');
const {analyseContract}=require('./riskEngine');

function browserJourney(fetchImpl,initial={},saved={}) {
 const script=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').split('<script>').at(-1).split('</script>')[0];
 const state=[],refs=[],effects=[];let stateIndex=0,refIndex=0,root;
 const location={pathname:'/',hash:''};
 const context={React:{...React,useState(value){const i=stateIndex++;if(!(i in state))state[i]=Object.hasOwn(initial,i)?initial[i]:typeof value==='function'?value():value;return[state[i],next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useRef(value){const i=refIndex++;return refs[i]||(refs[i]={current:value});},useCallback:fn=>fn,useEffect(callback){effects.push(callback);}},ReactDOM:{createRoot:()=>({render:element=>{root=element;}})},document:{getElementById:()=>({focus(){}}),activeElement:null},window:{location,history:{pushState(_s,_t,url){location.pathname=url;},replaceState(_s,_t,url){if(String(url).startsWith('#'))location.hash=url;else location.pathname=url;}},scrollTo(){}},localStorage:{getItem:()=>JSON.stringify(saved),setItem(_key,value){saved=JSON.parse(value);}},fetch:fetchImpl,AbortController,FormData,console,setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto};
 vm.createContext(context);vm.runInContext(script,context);
 function render(){stateIndex=0;refIndex=0;effects.length=0;return root.type();}
 function find(predicate,node){if(arguments.length===1)node=render();if(!node||typeof node!=='object')return;if(Array.isArray(node))return node.map(n=>find(predicate,n)).find(Boolean);if(predicate(node))return node;return find(predicate,node.props?.children);}
 const button=name=>{const node=find(n=>n.type==='button'&&(String(n.props['aria-label']||'').includes(name)||JSON.stringify(n.props.children).includes(name)));assert.ok(node,'Missing button: '+name);return node;};
 return {state,render,find,button,context,effects,location,saved:()=>saved};
}
function deferredFetch(){const requests=[];return {requests,fetch(url,options){if(url==='/api/events')return Promise.resolve({ok:true,json:async()=>({})});return new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));}};}
const settle=()=>new Promise(r=>setImmediate(r));

test('score bands use engine thresholds Low<40 Medium 40-69 High>=70',()=>{
  // Engine thresholds are the source of truth; UI table must match them.
  assert.equal(analyseContract('A simple agreement.','a.txt','ZA').level.length>0,true);
  const report={...analyseContract('EMPLOYMENT AGREEMENT. The employee shall work 55 hours per week.','old.txt'),_id:'old',isPaid:false};
  const ui=browserJourney(deferredFetch().fetch,{1:'result',3:'online',15:report});
  const bands=ui.find(n=>n.props?.className==='score-bands');
  assert.ok(bands,'score-bands details missing');
  const text=JSON.stringify(bands);
  assert.match(text,/0–39/);assert.match(text,/40–69/);assert.match(text,/70–100/);
  assert.match(text,/Low Risk/);assert.match(text,/Medium Risk/);assert.match(text,/High Risk/);
  assert.match(text,/not a legal clearance/i);
  assert.match(text,/How the score works/);
});

test('cancel scan during scan aborts and announces cancellation',async()=>{
  const network=deferredFetch();
  const ui=browserJourney(network.fetch,{6:true,7:'Reading document…'});
  const btn=ui.button('Cancel scan');
  btn.props.onClick();
  assert.equal(ui.state[6],false);
  assert.equal(ui.state[7],'');
  assert.match(ui.state[9],/Scan cancelled — nothing was charged or saved/);
});

test('routable preview helpers parse hash and path report ids',()=>{
  assert.equal(vm.runInContext("reportIdFromLocation({hash:'#/report/abc-123',pathname:'/'})",browserJourney(deferredFetch().fetch).context),'abc-123');
  assert.equal(vm.runInContext("reportIdFromLocation({hash:'',pathname:'/report/xyz'})",browserJourney(deferredFetch().fetch).context),'xyz');
  assert.equal(vm.runInContext("viewForPath('/report/abc')",browserJourney(deferredFetch().fetch).context),'result');
});

test('Resume card appears for saved free scan and resumes via /api/report/:id',async()=>{
  const network=deferredFetch();
  const saved={lastFreeScan:{id:'scan-1',score:62,level:'Medium Risk',docTitle:'Lease',at:Date.now()}};
  const ui=browserJourney(network.fetch,{},saved);
  const card=ui.find(n=>n.props?.className==='receipt-recovery resume-card');
  assert.ok(card,'resume card missing');
  ui.button('Resume your last scan').props.onClick();
  assert.equal(network.requests[0].url,'/api/report/scan-1');
  network.requests[0].resolve({ok:true,json:async()=>({_id:'scan-1',score:62,level:'Medium Risk',freePreview:true,issues:[],issuesLocked:[],isPaid:false})});
  await settle();
  assert.equal(ui.state[1],'result');
  assert.equal(ui.state[15]._id,'scan-1');
});

test('pending-receipt strip on landing and Paystack close recovery prompt',async()=>{
  const network=deferredFetch();
  const saved={pendingReceipt:'CC-pending-1',email:'buyer@example.test'};
  const ui=browserJourney(network.fetch,{2:{paystackPublicKey:'test-only',prices:{single:1900,pack3:3900,pack10:9900}},3:'online',19:'buyer@example.test'},saved);
  assert.ok(ui.find(n=>n.props?.className==='receipt-recovery pending-receipt-strip'),'pending strip missing on landing');
  let checkout;
  ui.context.PaystackPop=ui.context.window.PaystackPop={setup(options){checkout=options;return{openIframe(){}};}};
  ui.button('Pricing').props.onClick();
  ui.button('Buy R19').props.onClick();
  // checkout modal form submit
  ui.find(n=>n.type==='form'&&JSON.stringify(n.props.children).includes('receipt-email')).props.onSubmit({preventDefault(){}});
  assert.ok(checkout,'Paystack setup not called');
  checkout.onClose();
  assert.match(ui.state[9],/Did you finish paying/);
  assert.ok(ui.find(n=>n.props?.className==='receipt-recovery pay-recovery-panel'),'pay recovery panel missing');
  ui.button('Restore with reference').props.onClick();
  assert.equal(ui.state[1],'pricing');
});

test('GET /api/report/:id returns free preview and 404 for unknown id',async()=>{
  const os=require('node:os');
  for(const k of ['VERCEL','BLOB_STORE_ID','BLOB_READ_WRITE_TOKEN','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_TABLE'])delete process.env[k];
  process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-flagship-'));
  const store=require('./store'),app=require('./index');
  const server=app.listen(0);await new Promise(r=>server.once('listening',r));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const analysis=analyseContract('EMPLOYMENT AGREEMENT. The employee shall work 55 hours per week.','scan.txt');
    analysis._id='flagship-1';analysis.isPaid=false;
    await store.saveAnalysis('flagship-1',analysis);
    const ok=await fetch(base+'/api/report/flagship-1');
    assert.equal(ok.status,200);
    const data=await ok.json();
    assert.equal(data._id,'flagship-1');assert.equal(data.freePreview,true);assert.equal(data.isPaid,false);
    assert.ok(Array.isArray(data.issues));
    const missing=await fetch(base+'/api/report/does-not-exist');
    assert.equal(missing.status,404);
  }finally{server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
