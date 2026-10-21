// Role prompts are review questions, never evidence that a protection is missing.
const ROLES = ['neutral', 'tenant', 'landlord', 'employee', 'employer'];
function validatePerspective(value = 'neutral') {
  if (typeof value !== 'string' || !ROLES.includes(value.toLowerCase())) {
    throw Object.assign(new Error('Choose neutral, tenant, landlord, employee or employer.'), { status: 400 });
  }
  return value.toLowerCase();
}
function reportContext(guide, docType, perspective = 'neutral') {
  const role = validatePerspective(perspective);
  const lease = /lease|tenancy/i.test(docType), employment = /employment/i.test(docType);
  const compatible = role === 'neutral' || (lease && ['tenant','landlord'].includes(role)) || (employment && ['employee','employer'].includes(role));
  const questions = compatible ? ({
    tenant: ['What must you pay, when can the rent change, and how is the deposit returned?', 'What notice applies to entry, repairs and ending the tenancy?'],
    landlord: ['Which payments and property-care duties can you enforce under the agreement?', 'What notice, deposit records and repair obligations must you meet?'],
    employee: ['What pay, working hours, overtime and leave arrangements apply to you?', 'What notice, deductions and restrictions apply when the job ends?'],
    employer: ['What pay, hours, leave and record-keeping commitments are you making?', 'What process and notice should you check before changing or ending employment?'],
    neutral: []
  })[role] : [];
  const dates = [];
  for (const section of guide.sections) {
    const pattern = /\b\d{4}-\d{2}-\d{2}\b|\b(?:\d+|one|two|three|thirty|sixty)\s+(?:business\s+|working\s+|calendar\s+)?(?:days?|weeks?|months?|years?)\b/gi;
    for (const m of section.original.matchAll(pattern)) {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(m[0]);
      if (iso) {
        const date = new Date(m[0]+'T00:00:00Z');
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== m[0]) continue;
      }
      if (dates.some(d=>d.sourceLabel===section.sourceLabel && d.text===m[0])) continue;
      const start = Math.max(0,m.index-100), end=Math.min(section.original.length,m.index+m[0].length+120);
      dates.push({text:m[0],kind:iso?'date':'period',sourceLabel:section.sourceLabel,context:(start?'…':'')+section.original.slice(start,end)+(end<section.original.length?'…':'')});
      if (dates.length >= 30) break;
    }
    if (dates.length >= 30) break;
  }
  return {version:'1',perspective:role,roleNote:compatible?'Your role changes the review questions, not the risk score or legal rules.':'This role does not match the detected document type. General findings still apply; choose another role for relevant questions.',questions,dates,dateNote:'Detected ISO dates and selected periods from the included reading-guide sections only; not a complete deadline calendar. Read each source clause for conditions and linked terms.'};
}
module.exports = {ROLES,validatePerspective,reportContext};
