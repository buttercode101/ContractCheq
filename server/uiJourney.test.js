const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const React=require('react');
const {analyseContract}=require('./riskEngine');

// Retain real application hook state and execute the shipped frontend handlers.
// Deferred requests may ignore abort, so stale-response guards are tested too.
function browserJourney(fetchImpl,initial={},saved={}) {
 const script=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').split('<script>').at(-1).split('</script>')[0];
 const state=[],refs=[];let stateIndex=0,refIndex=0,root;
 const location={pathname:'/'};
 const context={React:{...React,useState(value){const i=stateIndex++;if(!(i in state))state[i]=Object.hasOwn(initial,i)?initial[i]:typeof value==='function'?value():value;return[state[i],next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useRef(value){const i=refIndex++;return refs[i]||(refs[i]={current:value});},useCallback:fn=>fn,useEffect(){}},ReactDOM:{createRoot:()=>({render:element=>{root=element;}})},document:{getElementById:()=>({}),activeElement:null},window:{location,history:{pushState(_s,_t,url){location.pathname=url;}},scrollTo(){}},localStorage:{getItem:()=>JSON.stringify(saved),setItem(_key,value){saved=JSON.parse(value);}},fetch:fetchImpl,AbortController,FormData,console,setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto};
 vm.createContext(context);vm.runInContext(script,context);
 function render(){stateIndex=0;refIndex=0;return root.type();}
 function find(predicate,node){if(arguments.length===1)node=render();if(!node||typeof node!=='object')return;if(Array.isArray(node))return node.map(n=>find(predicate,n)).find(Boolean);if(predicate(node))return node;return find(predicate,node.props?.children);}
 const button=name=>{const node=find(n=>n.type==='button'&&(String(n.props['aria-label']||'').includes(name)||JSON.stringify(n.props.children).includes(name)));assert.ok(node,'Missing button: '+name);return node;};
 const upload=name=>{const input=find(n=>n.type==='input'&&n.props.type==='file');assert.ok(input);input.props.onChange({target:{files:[new File(['EMPLOYMENT AGREEMENT. The employee shall work 55 hours per week.'],name,{type:'text/plain'})],value:''}});};
 return {state,render,find,button,upload,context};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('saved paid-report reopen cannot spend a new credit or override later navigation',async()=>{
 const network=deferredFetch(),saved={lastPaidReport:{analysisId:'previous-report',reference:'previous-receipt',email:'buyer@example.test'}};
 const ui=browserJourney(network.fetch,{},saved);
 const pending=ui.button('Reopen last unlocked report').props.onClick();
 assert.deepEqual(JSON.parse(network.requests[0].options.body),{...saved.lastPaidReport,reopenOnly:true});
 ui.button('Pricing').props.onClick();assert.equal(network.requests[0].options.signal.aborted,true);
 network.requests[0].resolve({ok:true,json:async()=>({_id:'previous-report',isPaid:true,credits:0})});await pending;await settle();
 assert.equal(ui.state[1],'pricing');assert.equal(ui.state[15],null);
});
const response=name=>({ok:true,json:async()=>({...analyseContract('EMPLOYMENT AGREEMENT. The employee shall work 55 hours per week.',name),_id:name,isPaid:false,freePreview:true})});
function deferredFetch(){const requests=[];return {requests,fetch(url,options){if(url==='/api/events')return Promise.resolve({ok:true,json:async()=>({})});return new Promise((resolve,reject)=>requests.push({url,options,resolve,reject}));}};}

test('leaving an upload page prevents its late response from replacing navigation',async()=>{
 const network=deferredFetch(),ui=browserJourney(network.fetch);ui.upload('first.txt');assert.equal(ui.state[6],true);
 ui.button('Pricing').props.onClick();assert.equal(ui.state[1],'pricing');assert.equal(network.requests[0].options.signal.aborted,true);
 network.requests[0].resolve(response('first.txt'));await settle();
 assert.equal(ui.state[1],'pricing');assert.equal(ui.state[15],null);assert.equal(ui.state[6],false);
});
test('the latest example wins even if an earlier response arrives last',async()=>{
 const network=deferredFetch(),ui=browserJourney(network.fetch);ui.button('Residential lease example report').props.onClick();ui.button('Employment offer example report').props.onClick();
 network.requests[1].resolve(response('second.txt'));await settle();network.requests[0].resolve(response('first.txt'));await settle();
 assert.equal(ui.state[15]._id,'second.txt');assert.equal(ui.state[6],false);
});
test('an abandoned upload failure cannot appear on another page',async()=>{
 const network=deferredFetch(),ui=browserJourney(network.fetch);ui.upload('first.txt');ui.button('Pricing').props.onClick();
 network.requests[0].reject(new Error('Network failure from old request'));await settle();
 assert.equal(ui.state[14],'');assert.equal(ui.state[1],'pricing');
});

test('payment journey requires server approval and recovers a lost response without another credit',async()=>{
 const os=require('node:os');for(const key of ['VERCEL','BLOB_STORE_ID','BLOB_READ_WRITE_TOKEN'])delete process.env[key];
 process.env.DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'cc-ui-payment-'));process.env.PAYSTACK_SECRET_KEY='test-only';
 const store=require('./store'),app=require('./index'),realFetch=global.fetch,wasDurable=store.durable;
 const server=app.listen(0);await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
 let paymentOptions,providerAmount=1,dropFirstUnlock=true;
 const until=async predicate=>{const deadline=Date.now()+4000;while(!predicate()&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));assert.ok(predicate(),'Journey did not reach expected state');};
 try{
  store.durable=()=>true;
  global.fetch=(url,options)=>String(url).startsWith('https://api.paystack.co/')?Promise.resolve({ok:true,json:async()=>({status:true,data:{status:'success',amount:providerAmount,currency:'ZAR',customer:{email:'buyer@example.test'},metadata:{product:'single'}}})}):realFetch(url,options);
  const ui=browserJourney(async(url,options)=>{const r=await realFetch(base+url,options);if(url==='/api/unlock-analysis'&&r.ok&&dropFirstUnlock){dropFirstUnlock=false;await r.text();throw new Error('Connection lost after server unlocked report');}return r;},{2:{paystackPublicKey:'test-only',prices:{single:1900,pack3:3900,pack10:9900},maxFileMb:4},3:'online'});
  ui.context.PaystackPop=ui.context.window.PaystackPop={setup(options){paymentOptions=options;return {openIframe(){}};}};
  ui.upload('payment-journey.txt');await until(()=>Boolean(ui.state[15]?._id));const analysisId=ui.state[15]._id;
  assert.equal(ui.state[15].isPaid,false);assert.equal(ui.state[15].plainLanguageGuide,undefined);
  await ui.button('Full report').props.onClick();
  ui.find(n=>n.type==='input'&&n.props.id==='receipt-email').props.onChange({target:{value:'buyer@example.test'}});
  ui.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
  assert.equal(paymentOptions.amount,1900);assert.equal(paymentOptions.currency,'ZAR');assert.equal(paymentOptions.metadata.analysisId,analysisId);
  const reference='CC-ui-payment-journey-receipt';paymentOptions.callback({reference});await until(()=>ui.state[14].includes('mismatch'));
  assert.equal(ui.state[15].isPaid,false);assert.equal(await store.getGrant(reference),null);
  providerAmount=1900;paymentOptions.callback({reference});await until(()=>ui.state[14].includes('Connection lost'));
  assert.equal((await store.getGrant(reference)).remaining,0);assert.equal(ui.state[15].isPaid,false);
  await ui.button('Use a credit').props.onClick();assert.equal(ui.state[15].isPaid,true);assert.ok(ui.state[15].plainLanguageGuide.sections.length>0);assert.equal(ui.state[17],0);
  const grant=await store.getGrant(reference);assert.equal(grant.remaining,0);assert.deepEqual(grant.unlocked,[analysisId]);assert.ok(ui.button('Export PDF'));
 }finally{global.fetch=realFetch;store.durable=wasDurable;server.close();fs.rmSync(process.env.DATA_DIR,{recursive:true,force:true});}
});
