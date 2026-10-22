const crypto = require('node:crypto');
const idFor = value => crypto.createHash('sha256').update(value).digest('hex').slice(0,16);
const actors = 'client|customer|tenant|lessee|landlord|lessor|employer|employee|freelancer|contractor|service provider|supplier|consultant|buyer|seller';
const rolePattern = new RegExp('\\b(?:the )?('+actors+')\\s+(?:shall|must|will|agrees to)\\s+(?:not\\s+)?(?:pay|deliver|provide|approve|complete|submit|supply|maintain|return|perform|issue|respond|review|obtain|keep|give|notify)\\b','i');
const paymentTypes = [
 ['payments','Payment terms',/\b(?:pay(?:ment|able|s|ing)?|invoices?|fees?|rent|salary|remuneration|charges?)\b/i],
 ['deposit','Deposits',/\b(?:deposits?|retainers?|upfront|up-front|advance payment)\b/i],
 ['milestones','Instalments and milestones',/\b(?:instalments?|installments?|milestones?|balance|staged payments?)\b/i],
 ['late','Late payment',/\b(?:late (?:payment|fees?)|overdue|default interest|interest on unpaid|penalt(?:y|ies))\b/i],
 ['refund','Refunds and cancellations',/\b(?:refund\w*|non-refundable|reimburse\w*|cancellation (?:fee|charge))\b/i]
];
function buildActionPlan(guide, docType, perspective, reportDates = []) {
 const sections = guide.sections || [];
 const evidence = s => ({sourceLabel:s.sourceLabel,quote:s.original});
 const rows = [];
 const paymentSummary = paymentTypes.map(([id,title,pattern])=>{
  const matches = sections.filter(s=>pattern.test(s.original));
  const entries = matches.slice(0,4).map(s=>{
   const text=s.original;
   const payer=text.match(new RegExp('\\b(?:the )?('+actors+')\\s+(?:shall|must|will|agrees to)\\s+pay\\b','i'));
   const recipient=text.match(new RegExp('\\bpay\\s+(?:the )?('+actors+')\\b','i')) || text.match(new RegExp('\\bpay\\b[^.!?]{0,120}\\bto\\s+(?:the )?('+actors+')\\b','i'));
   const row={id:idFor(id+'|'+s.sourceLabel+'|'+text),...evidence(s),amounts:[...new Set(s.amounts||[])],timing:[...new Set(s.timeTerms||[])],payer:payer?payer[1]:'Unclear — confirm',recipient:recipient?recipient[1]:'Unclear — confirm',status:'Needs confirmation',conditional:/\b(?:if|unless|after|upon|following|subject to|provided|within|acceptance|approval)\b/i.test(text)};
   rows.push(row); return row;
  });
  return {id,title,status:matches.length?'Wording found — confirm details':'Not found in reviewed text',entries,additionalMatches:Math.max(0,matches.length-entries.length)};
 });
 const obligations=[];
 for(const s of sections){
  const actor=s.original.match(rolePattern);
  const required=/\b(?:must|shall|agrees to|is required to)\b/i.test(s.original) || actor;
  if(!required || !/\b(?:pay|deliver|provide|approve|complete|submit|supply|maintain|return|perform|issue|respond|review|obtain|keep|give|notify|refrain|ensure)\w*\b/i.test(s.original))continue;
  obligations.push({id:idFor('obligation|'+s.sourceLabel+'|'+s.original),label:s.original.slice(0,170)+(s.original.length>170?'…':''),party:actor?actor[1]:'Unclear — confirm',...evidence(s),status:'Needs confirmation'});
  if(obligations.length>=40)break;
 }
 const services=/services|consultancy|consulting|statement of work/i.test(docType) || (!/lease|tenancy|employment/i.test(docType)&&['freelancer','client'].includes(perspective));
 const scopeChecks = services ? [
  ['deliverables','Deliverables and exclusions',/\b(?:deliverables?|scope of work|statement of work|services include|shall (?:deliver|provide)|must (?:deliver|provide)|will (?:deliver|provide))\b/i,'Please list the deliverables, exclusions and completion criteria.'],
  ['revisions','Revision limits',/\b(?:revisions?|rounds? of changes|changes? to (?:the )?(?:design|draft|work))\b/i,'Please confirm the included revision rounds and charges for additional revisions.'],
  ['acceptance','Acceptance and approval',/\b(?:acceptance|approv\w*|sign[- ]off|review period|deemed accepted)\b/i,'Please confirm who approves the work, the acceptance criteria and the review period.'],
  ['changes','Additional work and scope changes',/\b(?:change (?:request|order)|additional work|out[- ]of[- ]scope|scope changes?|variation)\b/i,'Please confirm how additional work is approved, priced and scheduled.'],
  ['ip','Ownership and permitted use',/\b(?:intellectual property|copyright|ownership|licen[cs]e|work product)\b/i,'Please confirm ownership, permitted use and whether any transfer depends on payment.']
 ].map(([id,title,pattern,question])=>{
  const matches=sections.filter(s=>pattern.test(s.original));
  const uncertain=matches.filter(s=>id==='revisions'?/\b(?:unlimited|any number of|as many)\b/i.test(s.original):id==='acceptance'?/\b(?:sole discretion|absolute discretion|satisfaction|satisfied)\b/i.test(s.original):false);
  return {id,title,status:uncertain.length?'Needs clarification':matches.length?'Wording found — confirm details':'Not found in reviewed text',question,evidence:(uncertain.length?uncertain:matches).slice(0,2).map(evidence)};
 }) : [];
 const questions=[];
 for(const check of scopeChecks)if(check.status!=='Wording found — confirm details')questions.push(check.question+(check.evidence[0]?' ('+check.evidence[0].sourceLabel+')':''));
 if(rows.some(r=>r.payer.startsWith('Unclear')||r.recipient.startsWith('Unclear')))questions.push('Please confirm who pays whom for each payment term shown in the report.');
 if(rows.some(r=>r.conditional||!r.timing.length))questions.push('Please confirm each payment deadline and the event that starts any relative period, such as invoice receipt or acceptance.');
 if(!paymentSummary[0].entries.length)questions.push('Please confirm the agreed fees, payer, recipient and payment schedule.');
 for(const q of guide.checklist||[])if(!q.found && questions.length<10)questions.push(q.note);
 const items=obligations.map(o=>({id:o.id,kind:'obligation',label:o.label,party:o.party,sourceLabel:o.sourceLabel,quote:o.quote,confirmed:false,done:false,calendarDate:'',dateConfirmed:false}));
 const seenSources=new Set(obligations.map(o=>o.sourceLabel));
 for(const row of rows){if(seenSources.has(row.sourceLabel))continue;seenSources.add(row.sourceLabel);items.push({id:idFor('payment|'+row.sourceLabel),kind:'payment',label:'Confirm payment wording: '+row.sourceLabel,party:row.payer,sourceLabel:row.sourceLabel,quote:row.quote,confirmed:false,done:false,calendarDate:'',dateConfirmed:false});}
 for(const date of reportDates)items.push({id:idFor('date|'+date.sourceLabel+'|'+date.text),kind:'date',label:'Date or period mentioned: '+date.text,party:'Confirm the responsible party',sourceLabel:date.sourceLabel,quote:date.context,confirmed:false,done:false,calendarDate:'',dateConfirmed:false});
 return {version:1,paymentSummary,obligations,scopeChecks,questions:[...new Set(questions)].slice(0,10),items:items.slice(0,80),coverage:'Based only on the reading-guide sections included in this report. Wording found does not establish completeness or enforceability. Mentioned amounts are not calculated balances owed; confirm parties, conditions and linked clauses.'};
}
module.exports={buildActionPlan};
