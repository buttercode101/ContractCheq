const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { analyseContract } = require('./riskEngine');

// Render the shipped inline application with a selected report state. This catches
// valid JavaScript that accidentally constructs findings outside the returned tree.
function reportTree(result, windowExtras = {}, savedState = {}) {
  const script = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8')
    .split('<script>').at(-1).split('</script>')[0];
  let stateIndex = 0, root;
  const context = {
    React: { ...React,
      useState(initial) {
        const index = stateIndex++;
        const value = index === 0 ? savedState : index === 1 ? 'result' : index === 3 ? 'online'
          : index === 15 ? result : typeof initial === 'function' ? initial() : initial;
        return [value, () => {}];
      },
      useEffect() {}, useCallback: callback => callback, useRef: value => ({ current: value }),
    },
    ReactDOM: { createRoot: () => ({ render: element => { root = element; } }) },
    document: { getElementById: () => ({}) },
    window: { location: { pathname: '/' }, ...windowExtras },
    localStorage: { getItem: () => {if(windowExtras.blockStorage)throw Error('Browser storage blocked');return null;} },
    fetch: () => Promise.resolve({ json: async () => ({}) }),
    console,
  };
  vm.createContext(context);
  for(const asset of ['checklist-tools.js','contract-actions.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',asset),'utf8'),context);
  vm.runInContext(script, context);
  return root.type();
}

const specimen = () => ({ ...analyseContract(
  'RESIDENTIAL LEASE. The landlord may enter the dwelling without notice. The deposit is non-refundable.',
  'render-fixture.pdf', 'ZA'), _id: 'render-fixture' });

test('free report renders findings, notes, details and unlock controls', () => {
  const full = specimen();
  const result = { ...full, isPaid: false, decision: undefined, priorities: undefined,
    issues: full.issues.slice(0, 3).map(({ recommendation, impact, ...issue }) => issue) };
  const html = renderToStaticMarkup(reportTree(result));
  for (const required of ['findings-list', 'Why it matters', 'notes-card', 'Rule version:', 'Unlock report'])
    assert.ok(html.includes(required), `missing free report content: ${required}`);
  assert.ok(!html.includes('Recommended action'));
  assert.ok(!html.includes('Export PDF'));
  assert.ok(!html.includes('Your obligations checklist'));
  assert.ok(!html.includes('Find wording in your contract'));
});

test('paid report renders every finding, recommendation, impact and PDF action', () => {
  const result = { ...specimen(), isPaid: true };
  result.reportContext = {perspective:'tenant',roleNote:'Role questions only',questions:['Confirm deposit records'],dateNote:'Read conditions',dates:[{text:'30 days',sourceLabel:'Text section 1',context:'Give 30 days notice before termination.'}]};
  const html = renderToStaticMarkup(reportTree(result));
  assert.equal((html.match(/class="finding-card/g) || []).length, result.issues.length);
  for (const required of ['Recommended action', 'Potential impact.', 'Export PDF', 'What to do before you sign', 'notes-card'])
    assert.ok(html.includes(required), `missing paid report content: ${required}`);
  assert.ok(!html.includes('Unlock report'));
  assert.ok(html.includes('Your contract, in everyday language'));
  for(const text of ['Payments &amp; actions','Payment summary','Your obligations checklist','Questions to send back'])assert.ok(html.includes(text));
  for(const text of ['Checklist &amp; dates','tenant review','Confirm deposit records','30 days','Text section 1','before termination']) assert.ok(html.includes(text));
  for(const text of ['Payments &amp; actions','Payment summary','Your obligations checklist','Questions to send back'])assert.ok(html.includes(text));
  assert.ok(html.includes('Original wording'));
  assert.ok(html.includes('Find wording in your contract'));
});

test('PDF export paginates long findings before writing outside the page', () => {
  const result = { ...specimen(), isPaid: true };
  result.issues[0].analysis = 'Long paragraph '.repeat(3000);
  result.reportContext={perspective:'employee',roleNote:'Role questions only',questions:['Check working hours'],dateNote:'Read conditions',dates:[{text:'2028-02-29',sourceLabel:'Text section 2',context:'Start date is 2028-02-29.'}]};
  let pages = 1, saved = false, writes = 0, output = [];
  class PDF {
    setFontSize() {}
    splitTextToSize(text) { return String(text).match(/.{1,90}/g) || ['']; }
    text(text, x, y) { assert.ok(y >= 16 && y <= 280, `text outside page: ${y}`); writes++; output.push(text); }
    addPage() { pages++; }
    save() { saved = true; }
  }
  const tree = reportTree(result, { jspdf: { jsPDF: PDF } });
  function find(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.map(find).find(Boolean);
    if (node.type === 'button' && JSON.stringify(node.props.children).includes('Export PDF')) return node;
    return find(node.props?.children);
  }
  const button = find(tree);
  assert.ok(button, 'export button must exist');
  button.props.onClick();
  assert.ok(output.join(' ').includes('Check working hours'));
  assert.ok(output.join(' ').includes('2028-02-29'));
  assert.ok(saved && pages > 1 && writes > 100);
  assert.ok(output.join(' ').includes('YOUR CONTRACT, IN EVERYDAY LANGUAGE'));
  assert.ok(output.join(' ').includes('Original wording:'));
});


test('a stale or forged browser unlock marker never grants report export',()=>{
 const result={...specimen(),isPaid:false,freePreview:true};
 const html=renderToStaticMarkup(reportTree(result,{}, {unlocked:[result._id]}));
 assert.ok(!html.includes('Export PDF'));assert.ok(!html.includes('Find wording in your contract'));
 assert.ok(html.includes('Unlock report'));
});

test('corrupt but valid-JSON browser storage is normalised before rendering',()=>{
 const script=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').split('<script>').at(-1).split('</script>')[0];
 for(const value of ['null','[]','{"credits":"bad","email":12,"notes":{"x":{}},"unlocked":{}}']){
  const context={React:{createElement:()=>{},...Object.fromEntries(['useState','useEffect','useCallback','useRef'].map(k=>[k,()=>{}]))},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})},localStorage:{getItem:()=>value}};
  vm.createContext(context);vm.runInContext(script,context);
  const saved=vm.runInContext('loadLS()',context);assert.ok(saved&&typeof saved==='object');assert.ok(!saved.email||typeof saved.email==='string');assert.ok(!saved.notes?.x);
 }
});

test('direct FAQ links resolve to populated pricing content and navigation updates history',()=>{
 const script=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').split('<script>').at(-1).split('</script>')[0];
 const context={React:{createElement:()=>{},...Object.fromEntries(['useState','useEffect','useCallback','useRef'].map(k=>[k,()=>{}]))},ReactDOM:{createRoot:()=>({render(){}})},document:{getElementById:()=>({})}};
 vm.createContext(context);vm.runInContext(script,context);
 assert.equal(vm.runInContext("viewForPath('/faq')",context),'pricing');assert.equal(vm.runInContext("viewForPath('/privacy/')",context),'privacy');
 assert.ok(script.includes("window.history.pushState({},'',pathname)"));assert.ok(script.includes("addEventListener('popstate',onBack)"));
});

test('blocked browser storage keeps the paid report and checklist readable',()=>{
 const result={...specimen(),isPaid:true};
 const html=renderToStaticMarkup(reportTree(result,{blockStorage:true}));assert.ok(html.includes('Your obligations checklist'));assert.ok(html.includes('Export PDF'));
});

test('failed optional AI is visible while the rules report remains readable',()=>{
 const result={...specimen(),isPaid:false,llmEnriched:false,aiStatus:'unavailable'};
 const html=renderToStaticMarkup(reportTree(result));assert.ok(html.includes('AI insights could not be added. Your rules-based report is ready.'));assert.ok(html.includes('findings-list'));assert.ok(!html.includes('Optional AI insights included.'));
});


test('OpenRouter and Groq findings are individually identified in reports and exports',()=>{
 for(const source of ['openrouter','groq']){
  const result={...specimen(),isPaid:true};result.issues[0].source=source;
  const html=renderToStaticMarkup(reportTree(result));assert.match(html,/class="ai-tag">AI-suggested/);
  const output=[];
  class PDF{setFontSize(){}splitTextToSize(t){return [t];}text(t){output.push(t);}addPage(){}save(){}}
  const tree=reportTree(result,{jspdf:{jsPDF:PDF}});
  function find(node){if(!node||typeof node!=='object')return;if(Array.isArray(node))return node.map(find).find(Boolean);if(node.type==='button'&&JSON.stringify(node.props.children).includes('Export PDF'))return node;return find(node.props?.children);}
  find(tree).props.onClick();assert.ok(output.some(t=>t.startsWith('AI-suggested finding')));
 }
});
