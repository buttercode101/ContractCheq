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
 const state=[],refs=[],effects=[];let stateIndex=0,refIndex=0,root;
 const location={pathname:'/'};
 const context={React:{...React,useState(value){const i=stateIndex++;if(!(i in state))state[i]=Object.hasOwn(initial,i)?initial[i]:typeof value==='function'?value():value;return[state[i],next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useRef(value){const i=refIndex++;return refs[i]||(refs[i]={current:value});},useCallback:fn=>fn,useEffect(callback){effects.push(callback);}},ReactDOM:{createRoot:()=>({render:element=>{root=element;}})},document:{getElementById:()=>({focus(){}}),activeElement:null},window:{location,history:{pushState(_s,_t,url){location.pathname=url;}},scrollTo(){}},localStorage:{getItem:()=>JSON.stringify(saved),setItem(_key,value){saved=JSON.parse(value);}},fetch:fetchImpl,AbortController,FormData,console,setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto};
 vm.createContext(context);vm.runInContext(script,context);
 function render(){stateIndex=0;refIndex=0;effects.length=0;return root.type();}
 function find(predicate,node){if(arguments.length===1)node=render();if(!node||typeof node!=='object')return;if(Array.isArray(node))return node.map(n=>find(predicate,n)).find(Boolean);if(predicate(node))return node;return find(predicate,node.props?.children);}
 const button=name=>{const node=find(n=>n.type==='button'&&(String(n.props['aria-label']||'').includes(name)||JSON.stringify(n.props.children).includes(name)));assert.ok(node,'Missing button: '+name);return node;};
 const upload=name=>{const input=find(n=>n.type==='input'&&n.props.type==='file');assert.ok(input);input.props.onChange({target:{files:[new File(['EMPLOYMENT AGREEMENT. The employee shall work 55 hours per week.'],name,{type:'text/plain'})],value:''}});};
 return {state,render,find,button,upload,context,effects};
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


test('a late credit unlock cannot replace the report after navigation',async()=>{
 const network=deferredFetch();
 const report={...analyseContract('EMPLOYMENT AGREEMENT. Employee works 55 hours per week.','old.txt'),_id:'old',isPaid:false};
 const ui=browserJourney(network.fetch,{1:'result',3:'online',15:report,17:1,18:'CC-existing-receipt',19:'buyer@example.test'});
 const pending=ui.button('Use a credit').props.onClick();assert.equal(network.requests.length,1);
 ui.button('Pricing').props.onClick();assert.equal(network.requests[0].options.signal.aborted,true);
 network.requests[0].resolve({ok:true,json:async()=>({...report,isPaid:true,credits:0})});await pending;
 assert.equal(ui.state[1],'pricing');assert.equal(ui.state[15].isPaid,false);assert.equal(ui.state[13],false);
});

test('payment confirmation retains recovery without replacing a later screen',async()=>{
 const network=deferredFetch();const report={...analyseContract('EMPLOYMENT AGREEMENT. Employee works 55 hours per week.','old.txt'),_id:'old',isPaid:false};
 const ui=browserJourney(network.fetch,{1:'result',2:{paystackPublicKey:'test-only',prices:{single:1900}},3:'online',15:report});
 let checkout;ui.context.PaystackPop=ui.context.window.PaystackPop={setup(options){checkout=options;return{openIframe(){}};}};
 await ui.button('Full report').props.onClick();ui.find(n=>n.type==='input'&&n.props.id==='receipt-email').props.onChange({target:{value:'buyer@example.test'}});
 ui.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});checkout.callback({reference:'CC-navigation-receipt'});
 ui.button('Pricing').props.onClick();network.requests[0].resolve({ok:true,json:async()=>({ok:true,grantId:'CC-navigation-receipt',credits:1})});await settle();
 assert.equal(network.requests.length,2);network.requests[1].resolve({ok:true,json:async()=>({...report,isPaid:true,credits:0})});await settle();
 assert.equal(ui.state[1],'pricing');assert.equal(ui.state[15].isPaid,false);assert.match(ui.state[9],/Your report was unlocked/);
 const saved=vm.runInContext('loadLS()',ui.context);assert.equal(saved.lastPaidReport.analysisId,'old');
});

test('stalled receipt requests abort and preserve an actionable no-repurchase message',async()=>{
 let expire,aborted=false;
 const ui=browserJourney((_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));})));
 ui.context.setTimeout=(fn,ms)=>{assert.equal(ms,25000);expire=fn;return 1;};ui.context.clearTimeout=()=>{};
 const pending=vm.runInContext("fetchJSON('/api/verify-payment',{method:'POST'})",ui.context);
 expire();await assert.rejects(pending,/restore your existing receipt; do not pay again/);assert.equal(aborted,true);
});


test('buying a single credit on Pricing never attempts to unlock a lingering example report',async()=>{
 const network=deferredFetch();const example={...analyseContract('RESIDENTIAL LEASE. Deposit is non-refundable.','example.txt'),_id:'demo-lease',isPaid:true,isDemo:true};
 const ui=browserJourney(network.fetch,{1:'pricing',2:{paystackPublicKey:'test-only',prices:{single:1900,pack3:3900,pack10:9900}},3:'online',15:example});
 let checkout;ui.context.PaystackPop=ui.context.window.PaystackPop={setup(options){checkout=options;return{openIframe(){}};}};
 ui.button('Buy R19').props.onClick();ui.find(n=>n.type==='input'&&n.props.id==='receipt-email').props.onChange({target:{value:'buyer@example.test'}});
 ui.find(n=>n.type==='form'&&JSON.stringify(n.props.children).includes('receipt-email')).props.onSubmit({preventDefault(){}});assert.equal(checkout.metadata.analysisId,'');checkout.callback({reference:'CC-pricing-example-receipt'});
 network.requests[0].resolve({ok:true,json:async()=>({ok:true,grantId:'CC-pricing-example-receipt',credits:1})});await settle();
 assert.equal(network.requests.length,1);assert.equal(ui.state[17],1);assert.match(ui.state[9],/1 report credits added/);assert.equal(ui.state[14],'');
});

test('configuration loading, outage and retry expose accurate AI and checkout states',async()=>{
 const network=deferredFetch(),ui=browserJourney(network.fetch);
 ui.render();const cleanup=ui.effects[0]();
 assert.match(ui.find(n=>n.props?.className==='ai-disclosure').props.children,/Checking AI availability/);
 assert.equal(ui.find(n=>n.type==='input'&&n.props.type==='checkbox').props.disabled,true);
 network.requests[0].resolve({ok:false,json:async()=>({error:'Synthetic outage'})});await settle();
 assert.equal(ui.state[3],'offline');assert.ok(ui.find(n=>n.props?.className==='service-status'));
 ui.button('Pricing').props.onClick();assert.ok(ui.find(n=>n.props?.className==='service-status'));
 assert.equal(ui.button('Buy R19').props.disabled,true);
 const retry=ui.button('Retry connection').props.onClick;
 ui.state[5]=true;
 const first=retry();assert.equal(ui.button('Reconnecting…').props.disabled,true);assert.equal(ui.state[5],false);
 const latest=retry();
 assert.equal(network.requests[1].options.signal.aborted,true);
 const config={prices:{single:1900,pack3:3900,pack10:9900},paystackPublicKey:'test-only',aiEnrichmentEnabled:true,maxFileMb:4};
 network.requests[2].resolve({ok:true,json:async()=>config});await latest;
 network.requests[1].resolve({ok:true,json:async()=>({...config,aiEnrichmentEnabled:false})});await first;
 assert.equal(ui.state[3],'online');assert.equal(ui.state[2].aiEnrichmentEnabled,true);
 assert.equal(ui.button('Buy R19').props.disabled,false);
 assert.equal(ui.find(n=>n.props?.className==='service-status'),undefined);
 ui.button('Check a contract').props.onClick();
 assert.equal(ui.find(n=>n.type==='input'&&n.props.type==='checkbox').props.disabled,false);
 cleanup();
});

test('a stalled configuration request times out into actionable recovery',async()=>{
 let expire,aborted=false;
 const ui=browserJourney((url,options)=>url==='/api/events'?Promise.resolve({}):new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));})));
 ui.context.setTimeout=(fn,ms)=>{assert.equal(ms,25000);expire=fn;return 1;};ui.context.clearTimeout=()=>{};
 ui.render();const cleanup=ui.effects[0]();expire();await settle();
 assert.equal(aborted,true);assert.equal(ui.state[3],'offline');assert.ok(ui.button('Retry connection'));
 cleanup();
});

test('incomplete price settings never enable checkout',async()=>{
 const network=deferredFetch(),ui=browserJourney(network.fetch);
 ui.render();const cleanup=ui.effects[0]();
 network.requests[0].resolve({ok:true,json:async()=>({prices:{single:1900},aiEnrichmentEnabled:true})});await settle();
 assert.equal(ui.state[3],'offline');ui.button('Pricing').props.onClick();assert.equal(ui.button('Buy R19').props.disabled,true);
 cleanup();
});

test('navigation sets descriptive tab titles without exposing contract filenames',()=>{
 const ui=browserJourney(()=>Promise.resolve({}));
 ui.render();ui.effects[2]();assert.equal(ui.context.document.title,'Understand your contract before you sign | ContractCheck');
 ui.button('Pricing').props.onClick();ui.render();ui.effects[2]();assert.equal(ui.context.document.title,'Pricing | ContractCheck');
 ui.state[1]='result';ui.render();ui.effects[2]();assert.equal(ui.context.document.title,'Your report | ContractCheck');
});
