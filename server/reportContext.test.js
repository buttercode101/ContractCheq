const test=require('node:test');
const assert=require('node:assert/strict');
const {reportContext,validatePerspective}=require('./reportContext');
const {analyseContract}=require('./riskEngine');
const {freeViewOf}=require('./index').__internal;
test('roles tailor questions without changing risk or claiming missing protections',()=>{
 const text='EMPLOYMENT AGREEMENT. Overtime is compensated at one and a half times the wage by agreement. Salary R9000 monthly.';
 const general=analyseContract(text,'job','ZA');
 for(const role of ['employee','employer']){
  const result=analyseContract(text,'job','ZA',role);
  assert.equal(result.score,general.score);assert.deepEqual(result.issues,general.issues);
  assert.equal(result.reportContext.questions.length,2);
  assert.ok(!result.issues.some(i=>i.id.startsWith('missing-overtime')));
 }
 const mismatch=analyseContract(text,'job','ZA','tenant').reportContext;
 assert.equal(mismatch.questions.length,0);assert.match(mismatch.roleNote,/does not match/);
 assert.throws(()=>validatePerspective('administrator'),/Choose neutral/);
 assert.throws(()=>validatePerspective({}),/Choose neutral/);
});
test('dates reject invalid calendar values and preserve distinct clause contexts',()=>{
 const sections=[{sourceLabel:'Text section 1',original:'Rent begins 2028-02-29. Invalid dates 2026-02-29 and 2026-99-99 are mistakes. Give 30 days written notice before termination.'},{sourceLabel:'Text section 2',original:'An invoice must be paid within 30 days of receipt.'}];
 const context=reportContext({sections},'Lease','tenant');
 assert.deepEqual(context.dates.map(d=>d.text),['2028-02-29','30 days','30 days']);
 assert.match(context.dates[1].context,/termination/);assert.match(context.dates[2].context,/invoice/);
 assert.equal(context.dates[2].sourceLabel,'Text section 2');
 assert.ok(!context.dates.some(d=>d.text==='2026-99-99'));
});
test('no covered findings never becomes a SIGN verdict',()=>{
 const result=analyseContract('AGREEMENT. All terms are in Annexure A, which has not been provided.','missing','ZA');
 assert.equal(result.verdict,undefined);assert.match(result.decision,/review/);
});
test('free preview admits only approved fields, even when new paid fields are added',()=>{
 const full=analyseContract('RESIDENTIAL LEASE. Landlord may enter without notice. Give 30 days notice.','lease','ZA','tenant');
 full.rawText='secret';full.futurePaidField='secret';full.issues[0].suggestedLanguage='paid wording';full.issues[0].futurePaidField='paid';
 const view=freeViewOf(full);
 for(const key of ['reportContext','plainLanguageGuide','rawText','futurePaidField','decision','priorities']) assert.equal(view[key],undefined,key);
 for(const issue of view.issues) for(const key of ['recommendation','impact','suggestedLanguage','futurePaidField']) assert.equal(issue[key],undefined,key);
 assert.ok(full.reportContext.questions.length);assert.ok(full.plainLanguageGuide);
});
