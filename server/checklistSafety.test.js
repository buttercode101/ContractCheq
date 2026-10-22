const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const tools=require('../public/checklist-tools');
const backup=role=>({version:1,id:'imported',title:'Imported checklist',role,items:[{id:'invoice',kind:'obligation',label:'Pay invoice',quote:'Client must pay R5000 after acceptance.',sourceLabel:'Text section 1',confirmed:true,done:false,calendarDate:'2026-11-30',dateConfirmed:true}]});
test('untrusted backup roles cannot crash saved checklist rendering',()=>{
 for(const role of ['__proto__','constructor','toString','unknown']){
  const context={React,window:{ContractChecklist:tools},localStorage:{getItem:()=>JSON.stringify([backup(role)])}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/contract-actions.js'),'utf8'),context);
  const html=renderToStaticMarkup(React.createElement(context.window.ContractActionsUI.SavedChecklists));
  assert.ok(html.includes('Imported checklist'));assert.ok(html.includes('General review'));
  assert.equal(tools.normalize(backup(role)).role,'neutral');
 }
 assert.equal(tools.normalize(backup('freelancer')).role,'freelancer');
});
test('calendar export rejects out-of-range dates rather than producing a malformed end date',()=>{
 const entry=backup('client');
 entry.items[0].calendarDate='9999-12-31';assert.throws(()=>tools.calendar(entry),/Confirm|date/);
 entry.items[0].calendarDate='0000-01-01';assert.throws(()=>tools.calendar(entry),/Confirm|date/);
 entry.items[0].calendarDate='9999-12-30';const ics=tools.calendar(entry);
 assert.match(ics,/DTSTART;VALUE=DATE:99991230/);assert.match(ics,/DTEND;VALUE=DATE:99991231/);
});
