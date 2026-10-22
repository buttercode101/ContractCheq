const test=require('node:test'),assert=require('node:assert/strict');
const {analyseContract}=require('./riskEngine');const {buildActionPlan}=require('./actionPlan');const tools=require('../public/checklist-tools');
const fixture='SERVICE AGREEMENT. Client must pay Freelancer R5000 within 30 days after acceptance. Freelancer shall deliver a website with five pages. Client must approve the draft within 5 business days. Unlimited revisions are included. Acceptance is at the sole discretion of Client. Additional work requires a change order. Copyright transfers only after final payment.';
test('payment wording preserves actors, amounts and conditional triggers without balances',()=>{
 const r=analyseContract(fixture,'service','ZA','freelancer'),p=r.actionPlan;assert.equal(r.reportContext.perspective,'freelancer');assert.equal(r.reportContext.questions.length,2);
 const payment=p.paymentSummary.find(x=>x.id==='payments').entries[0];assert.equal(payment.payer,'Client');assert.equal(payment.recipient,'Freelancer');assert.equal(payment.conditional,true);assert.ok(payment.amounts.includes('R5000'));assert.match(payment.quote,/after acceptance/);assert.equal(p.totalOwed,undefined);
 assert.ok(p.obligations.some(x=>/deliver a website/.test(x.quote)));assert.ok(p.obligations.some(x=>/approve the draft/.test(x.quote)));assert.ok(p.items.every(x=>!x.confirmed&&!x.done&&!x.calendarDate));
 assert.equal(p.scopeChecks.find(x=>x.id==='revisions').status,'Needs clarification');assert.equal(p.scopeChecks.find(x=>x.id==='acceptance').status,'Needs clarification');assert.ok(p.questions.some(q=>/revision/.test(q)));
});
test('missing evidence and negations remain explicit rather than inferred charges',()=>{
 const guide={sections:[{sourceLabel:'Text section 1',original:'No late fees apply. No deposit is payable.',amounts:[],timeTerms:[]}],checklist:[]};
 const p=buildActionPlan(guide,'Services Agreement','client');assert.equal(p.paymentSummary.find(x=>x.id==='refund').status,'Not found in reviewed text');const late=p.paymentSummary.find(x=>x.id==='late').entries[0];assert.match(late.quote,/No late fees/);assert.deepEqual(late.amounts,[]);assert.match(late.payer,/Unclear/);assert.equal(p.scopeChecks[0].evidence.length,0);
});
const entry=()=>({version:1,id:'test',title:'Test contract',role:'freelancer',items:[{id:'one',kind:'obligation',label:'Pay invoice',sourceLabel:'Text section 1',quote:'Client must pay within 30 days after acceptance.',confirmed:false,done:false,calendarDate:'',dateConfirmed:false}]});
test('calendar export requires explicit confirmation and never computes relative deadlines',()=>{
 const e=entry();assert.throws(()=>tools.calendar(e),/Confirm/);e.items[0].calendarDate='2026-02-30';e.items[0].dateConfirmed=true;assert.throws(()=>tools.calendar(e),/Confirm/);e.items[0].calendarDate='2026-11-30';assert.throws(()=>tools.calendar(e),/Confirm/);e.items[0].confirmed=true;
 const ics=tools.calendar(e,new Date('2026-10-22T00:00:00Z'));assert.match(ics,/DTSTART;VALUE=DATE:20261130/);assert.match(ics,/DTEND;VALUE=DATE:20261201/);assert.match(ics.replace(/\r\n /g,''),/30 days after acceptance/);assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,1);
 e.title='Name\r\nBEGIN:VEVENT;injected,é'.repeat(8);const safe=tools.calendar(e);assert.equal((safe.match(/\r\nBEGIN:VEVENT\r\n/g)||[]).length,1);for(const line of safe.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
});
test('saved checklists use a separate explicit storage key, survive reload, and reject corrupt backups',()=>{
 let raw=null,writes=0;const storage={getItem:key=>{assert.equal(key,tools.KEY);return raw;},setItem:(key,value)=>{assert.equal(key,tools.KEY);writes++;raw=value;}};
 assert.equal(tools.read(storage).entries.length,0);assert.equal(writes,0);const e=entry();e.paymentReference='must not persist';tools.save(storage,e);assert.equal(writes,1);assert.equal(tools.read(storage).entries[0].title,'Test contract');assert.ok(!raw.includes('paymentReference'));
 const corrupt=entry();corrupt.items.push(corrupt.items[0]);assert.throws(()=>tools.normalize(corrupt),/duplicate/);raw='null';assert.ok(tools.read(storage).error);assert.throws(()=>tools.save(storage,e),/could not be read/);
 raw='[]';tools.save(storage,e);tools.remove(storage,e.id);assert.deepEqual(tools.read(storage).entries,[]);assert.throws(()=>tools.save({getItem:()=>null,setItem:()=>{throw Error('quota');}},e),/Could not save/);
});

test('client and freelancer roles preserve the same legal findings and score',()=>{
 const baseline=analyseContract(fixture,'service','ZA');
 for(const role of ['client','freelancer']){const r=analyseContract(fixture,'service','ZA',role);assert.equal(r.score,baseline.score);assert.deepEqual(r.issues,baseline.issues);assert.equal(r.reportContext.questions.length,2);}
 const lease=analyseContract('RESIDENTIAL LEASE. Tenant shall pay R5000 monthly.','lease','ZA','freelancer');assert.equal(lease.actionPlan.scopeChecks.length,0);assert.equal(lease.reportContext.questions.length,0);
});
test('unreadable storage and duplicate reports cannot silently erase saved checklists',()=>{
 assert.ok(tools.read({getItem:()=>{throw Error('blocked');}}).error);
 const e=entry();const duplicates={getItem:()=>JSON.stringify([e,e]),setItem:()=>assert.fail('must not overwrite corrupt storage')};assert.ok(tools.read(duplicates).error);assert.throws(()=>tools.save(duplicates,e));
 const nested=entry();nested.items[0].done=true;nested.items[0].dateConfirmed=true;nested.items[0].calendarDate='2026-11-30';const normalized=tools.normalize(nested);assert.equal(normalized.items[0].done,false);assert.equal(normalized.items[0].dateConfirmed,false);
});
