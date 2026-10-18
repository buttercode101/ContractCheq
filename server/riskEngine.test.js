const test=require('node:test'),assert=require('node:assert/strict'),{analyseContract}=require('./riskEngine');
test('deposit-interest exclusions recognise deposit-first wording and a following sentence',()=>{
 for(const wording of ['The deposit is R8000. No interest will be paid.','The deposit is R8000 and no interest will accrue.','The deposit is R8000.\nNo interest shall be paid.']){
  const r=analyseContract('RESIDENTIAL LEASE AGREEMENT. '+wording,'lease.txt','ZA');
  const finding=r.issues.find(i=>i.id.startsWith('rha-dep-'));
  assert.ok(finding,'Missing deposit-interest flag: '+wording);
  assert.match(finding.excerpt,/deposit/i);assert.match(finding.excerpt,/no interest/i);
 }
});
test('deposit-interest exclusions preserve protective wording, commercial scope and unrelated rent interest',()=>{
 for(const wording of ['The deposit is R8000 and earns interest in an interest-bearing account.','The deposit is R8000. No interest will be paid on overdue rent.','It is prohibited to hold the deposit without interest.','The deposit may not be held without interest.']){
  assert.ok(!analyseContract('RESIDENTIAL LEASE AGREEMENT. '+wording,'lease.txt','ZA').issues.some(i=>i.id.startsWith('rha-dep-')),wording);
 }
 assert.ok(!analyseContract('COMMERCIAL LEASE for retail shop premises. The deposit is R8000. No interest will be paid.','shop.txt','ZA').issues.some(i=>i.id.startsWith('rha-dep-')));
});
for(const specimen of require('./test-contracts.json'))test(specimen.id,()=>{const r=analyseContract(specimen.text,specimen.id,specimen.jurisdiction);const ids=r.issues.map(x=>x.id.replace(/-\d+$/,'')); for(const expected of specimen.expected) assert.ok(ids.includes(expected), `missing expected ${expected}: ${ids.join(', ')}`);assert.ok(typeof r.exposure==='string' && r.exposure.length>0);assert.ok(r.coverageWarning);});
test('Service cancellation is not an employment dismissal',()=>{assert.ok(!analyseContract('SERVICES AGREEMENT. Supplier may terminate without notice. Payment is due monthly.','service').issues.some(x=>x.id.startsWith('lra')));});
test('Protective first match does not hide an unsafe clause later',()=>{const r=analyseContract('Nothing excludes liability for personal injury. Clause 7: Supplier excludes liability for death or personal injury caused by negligence.','service','UK');assert.equal(r.issuesCount,1);assert.match(r.issues[0].excerpt,/Clause 7/);});
test('a monthly interest rate alone does not establish an NCA breach',()=>{const r=analyseContract('CREDIT AGREEMENT. Interest rate is 1 percent per month. An affordability assessment has been completed.','loan','ZA');assert.ok(!r.issues.some(x=>x.id.startsWith('nca')));});
test('sale title outranks incidental rental references',()=>{assert.match(analyseContract('SALE AGREEMENT. Buyer purchases the property from seller. An existing tenant occupies the premises under a lease.','property-sale.pdf','ZA').docType,/Sale Agreement/);});

test('paid decision brief includes prioritized action and confidence',()=>{const r=analyseContract('RESIDENTIAL LEASE. Rent R8000. The deposit is non-refundable. Landlord may enter the premises without notice.','lease.pdf','ZA');assert.match(r.decision,/Do not sign|Negotiate/);assert.ok(r.priorities.length>0);assert.ok(r.confidence);assert.notEqual(r.exposure,'Not estimated');});
test('surety is treated as a high-priority personal liability risk',()=>{const r=analyseContract('SERVICE AGREEMENT. The director binds himself as surety and co-principal debtor for all amounts on a continuing unlimited basis.','service.pdf','ZA');assert.ok(r.issues.some(x=>x.id.startsWith('surety-')));});
test('lease completeness flags missing inspection process',()=>{const r=analyseContract('RESIDENTIAL LEASE. Monthly rent R9000. Deposit will be held in an interest-bearing account.','lease.pdf','ZA');assert.ok(r.issues.some(x=>x.id.startsWith('missing-lease-inspection-')));});


test('commercial lease does not receive residential Rental Housing Act findings',()=>{
 const r=analyseContract('COMMERCIAL LEASE AGREEMENT for retail shop premises. A security deposit is payable and access arrangements apply.','shop-lease.txt','ZA');
 assert.ok(!r.issues.some(x=>String(x.lawRef||x.law).includes('Rental Housing Act')));
});

test('deposit delay and long restraint patterns recognise real spaces',()=>{
 assert.ok(analyseContract('RESIDENTIAL LEASE. The deposit will be returned after 60 days.','lease.txt').issues.some(i=>i.id.startsWith('rha-deposit-process')));
 assert.ok(analyseContract('EMPLOYMENT AGREEMENT. A restraint of trade applies for 36 months after termination.','employment.txt').issues.some(i=>i.id.startsWith('restraint-')));
});
test('commercial deposits and service payments do not receive residential or employee rules',()=>{
 assert.ok(!analyseContract('COMMERCIAL LEASE for retail shop premises. The deposit is returned after 60 days.','shop.txt').issues.some(i=>i.id.startsWith('rha-')));
 assert.ok(!analyseContract('SERVICES AGREEMENT. The supplier may deduct any amount from the invoice.','service.txt').issues.some(i=>i.id.startsWith('employment-deductions')));
});
test('section numbers are not mistaken for rand amounts or minimum financial exposure',()=>{
 const r=analyseContract('RESIDENTIAL LEASE. Refer to number 1000. The deposit is non-refundable.','lease.txt');
 assert.match(r.exposure,/Not safely quantifiable/);
 const paid=analyseContract('RESIDENTIAL LEASE. The rent is R8000. The deposit is non-refundable.','lease.txt');
 assert.match(paid.exposure,/An amount of R/);assert.ok(!paid.exposure.includes('At least'));
});
