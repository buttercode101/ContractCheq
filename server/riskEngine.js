/**
 * ContractCheck risk engine v3 — ZA + UK
 * Check & Flag Only. Not legal advice.
 */
const RULES_VERSION = '4.0-sa-2026';

const RULES = [
  {
    id: 'rha-entry',
    laws: ['Rental Housing Regulations reg 9', 'Constitution s14'],
    severity: 'HIGH RISK',
    score: 90,
    tags: ['RHA', 'Constitution'],
    patterns: [
      /enter\s+(the\s+)?(premises|property|dwelling|house|flat|apartment)\s+(at\s+any\s+time|without\s+(prior\s+)?notice|without\s+notice)/i,
      /landlord\s+(may|can|shall\s+have\s+the\s+right\s+to)\s+enter\s+.{0,50}(without\s+notice|at\s+any\s+time)/i,
      /right\s+of\s+entry\s+without\s+notice/i,
      /inspect.{0,40}at\s+any\s+time/i,
    ],
    fb: 'Landlord may enter premises without reasonable notice.',
    analysis:
      'Section 14 of the Constitution protects privacy, and Rental Housing unfair-practice regulations require reasonable notice and entry at a reasonable time for permitted landlord access.',
    rec: 'Require reasonable prior notice for non-emergency entry and limit access to permitted purposes at reasonable times.',
    impact: 'Claim for invasion of privacy; possible reduction of rental for impaired use and enjoyment.',
  },
  {
    id: 'rha-dep',
    laws: ['CPA s48 & s51', 'RHA s5(3)(c)'],
    severity: 'HIGH RISK',
    score: 85,
    tags: ['CPA', 'RHA'],
    patterns: [
      /deposit\s+is\s+(non[- ]?refundable|forfeited|not\s+refundable)/i,
      /deposit.{0,50}(retained|kept|forfeited).{0,40}(all\s+circumstances|regardless|even\s+if)/i,
      /no\s+interest\s+(will\s+)?(accrue|be\s+paid|payable).{0,30}deposit/i,
      /deposit.{0,30}without\s+interest/i,
    ],
    fb: 'Deposit non-refundable / no interest accrues.',
    analysis:
      'The Consumer Protection Act prohibits excessively one-sided terms. Forfeiture despite landlord fault is unfair under CPA s48/s51. RHA requires the deposit in an interest-bearing account.',
    rec: 'Ensure deposit is refundable subject only to reasonable proven damages. Request proof of interest-bearing account.',
    impact: 'Risk of losing some or all of the deposit even when not at fault; the amount depends on the contract, rent and proven deductions.',
  },
  {
    id: 'popia',
    laws: ['POPIA s11 & s18', 'POPIA s8'],
    severity: 'HIGH RISK',
    score: 88,
    tags: ['POPIA'],
    patterns: [
      /consent.{0,50}(sell|selling|share|transfer|disclose).{0,50}(id\s*number|identity|biometric|bank\s+statement|personal\s+data)/i,
      /(id\s*number|identity\s+number|biometric).{0,60}(third[- ]party|marketing|credit\s+bureau|sold|shared)/i,
      /personal\s+(information|data).{0,50}(sold|marketed|shared\s+with\s+third)/i,
      /consent\s+to\s+(the\s+)?(processing|use).{0,40}(marketing|third[- ]parties)/i,
    ],
    fb: 'Consent to sell/share ID, biometric or bank data with third parties / marketers.',
    analysis:
      'POPIA requires specific, informed consent and purpose limitation. Blanket consent to sell ID numbers or biometric data to marketing partners exceeds what is reasonably necessary and violates data minimisation.',
    rec: 'Strike marketing sale clauses. Limit consent to credit checks strictly necessary for this agreement; require deletion after vetting.',
    impact: 'Complaints to the Information Regulator; personal data exposure and fraud risk.',
  },
  {
    id: 'bcea',
    laws: ['BCEA s9 & s10', 'BCEA s14'],
    severity: 'HIGH RISK',
    score: 82,
    tags: ['BCEA', 'LRA'],
    patterns: [
      /(work|working)\s+(4[6-9]|[5-9]\d|\d{3}|fifty|fifty[- ]five|sixty)\s+hours?\s+(per\s+)?(week)/i,
      /overtime.{0,50}(without\s+(additional\s+)?(pay|compensation)|unpaid|no\s+extra)/i,
      /waive(s|r)?.{0,35}(meal\s+(interval|break)|right\s+to\s+meal)/i,
      /ordinary\s+hours?.{0,25}(exceed|more\s+than)\s*45/i,
      /55\s+hours?\s+per\s+week/i,
    ],
    fb: 'Excessive weekly hours and/or unpaid overtime / meal-interval waiver.',
    analysis:
      'For employees to whom these working-time provisions apply, the BCEA generally limits ordinary hours to 45 per week, requires overtime agreement and provides a 1.5× overtime-pay baseline while allowing specified paid-time-off arrangements. Meal-interval rules also allow limited written variations. A blanket 55-hour ordinary week, unpaid overtime or broad meal-break waiver deserves review.',
    rec: 'Check whether the BCEA working-time provisions apply to this employee. If they do, align ordinary hours, overtime agreement/compensation and meal intervals with sections 9, 10 and 14, including any lawful written variations.',
    impact: 'Unpaid labour claim and CCMA dispute; employer may be liable for arrears.',
  },
  {
    id: 'cpa-unfair',
    laws: ['CPA s48', 'CPA s51'],
    severity: 'MEDIUM RISK',
    score: 72,
    tags: ['CPA'],
    patterns: [
      /waive(s|r)?.{0,45}(all\s+)?(rights|claims|liability)/i,
      /indemnif(y|ies|ication).{0,45}(all|any).{0,25}(loss|damage|claim)/i,
      /no\s+liability.{0,35}(whatsoever|under\s+any\s+circumstances)/i,
      /exclusive\s+remedy/i,
      /limitation\s+of\s+liability.{0,40}(nil|zero|none)/i,
    ],
    fb: 'Broad waiver of rights or total limitation of liability.',
    analysis:
      'CPA s48 prohibits unfair, unreasonable or unjust terms. Over-broad indemnities and total exclusion of liability are frequently limited or struck down by courts and the National Consumer Tribunal.',
    rec: 'Narrow any indemnity to losses caused by the other party’s negligence. Remove total liability exclusions.',
    impact: 'Clause may be declared void; residual exposure remains.',
  },
  {
    id: 'nca',
    laws: ['NCA s89', 'NCA s90'],
    severity: 'MEDIUM RISK',
    score: 70,
    tags: ['NCA'],
    patterns: [
      /penalty\s+interest/i,
      /credit\s+agreement.{0,45}(without|no).{0,25}(assessment|affordability)/i,
      /reckless\s+credit/i,
    ],
    fb: 'Credit terms that may breach NCA affordability or rate rules.',
    analysis:
      'The National Credit Act requires affordability assessments and prohibits reckless credit. Excessive penalty interest or failure to assess can render terms unlawful.',
    rec: 'Confirm an affordability assessment was performed. Cap penalty interest at the NCA maximum.',
    impact: 'Agreement or terms may be set aside; overpayments recoverable.',
  },
  {
    id: 'lra',
    laws: ['LRA s185', 'LRA s186'],
    severity: 'MEDIUM RISK',
    score: 68,
    tags: ['LRA'],
    patterns: [
      /terminate.{0,35}(at\s+will|without\s+(notice|cause|reason))/i,
      /summary\s+dismissal.{0,35}(without|no).{0,20}(hearing|procedure)/i,
      /probation.{0,45}(no\s+rights|waive)/i,
      /sole\s+discretion\s+of\s+(the\s+)?(company|employer).{0,30}(terminate|dismiss)/i,
    ],
    fb: 'Termination at will or without fair procedure.',
    analysis:
      'The Labour Relations Act requires fair procedure and a fair reason for dismissal. “At will” or summary dismissal clauses that bypass hearings are unenforceable for employees covered by the LRA.',
    rec: 'Align termination clauses with the Code of Good Practice: Dismissal. Provide for a hearing before dismissal.',
    impact: 'Unfair dismissal claim at the CCMA; possible reinstatement or compensation.',
  },
  {
    id: 'onesided',
    laws: ['CPA s48'],
    severity: 'MEDIUM RISK',
    score: 60,
    tags: ['CPA'],
    patterns: [
      /sole\s+discretion\s+of\s+(the\s+)?(landlord|employer|company|seller)/i,
      /may\s+be\s+(amended|changed|varied).{0,35}(at\s+any\s+time|without\s+notice)/i,
      /binding\s+on\s+(you|the\s+tenant|employee).{0,25}(only|solely)/i,
    ],
    fb: 'Unilateral variation or sole-discretion clause.',
    analysis:
      'Clauses allowing one party to change material terms unilaterally are often regarded as unfair under the CPA and may be unenforceable.',
    rec: 'Require mutual written agreement for material amendments.',
    impact: 'Clause may be severed; uncertainty over enforceability.',
  },
  {
    id: 'nda-overbroad',
    laws: ['Common law', 'CPA s48'],
    severity: 'MEDIUM RISK',
    score: 58,
    tags: ['CPA'],
    patterns: [
      /confidential.{0,40}(in\s+perpetuity|forever|indefinite)/i,
      /non[- ]compete.{0,40}(\d+)\s*(year|years)/i,
      /restraint\s+of\s+trade.{0,50}(republic|south\s+africa|worldwide)/i,
    ],
    fb: 'Over-broad confidentiality, non-compete or restraint of trade.',
    analysis:
      'South African courts scrutinise restraints of trade for reasonableness in time, geography and scope. Perpetual confidentiality for non-trade-secret information and country-wide multi-year non-competes are frequently narrowed.',
    rec: 'Limit confidentiality duration for non-trade secrets; narrow restraint to reasonable time, area and activities.',
    impact: 'Restraint may be partially or wholly unenforceable.',
  },
  {
    id:'cpa-fixed-term',
    laws:['CPA s14','Consumer Protection Regulations reg 5'],
    severity:'HIGH RISK', score:84, tags:['CPA','Cancellation'],
    patterns:[/fixed[- ]term.{0,100}(no cancellation|cannot cancel|non[- ]cancellable)/i,/cancel.{0,50}(penalty|fee).{0,30}(all remaining|full remaining|100%)/i,/automatic(ally)? renew.{0,70}(without notice|no notice)/i],
    fb:'Fixed-term cancellation or automatic-renewal term may materially restrict cancellation rights.',
    analysis:'CPA section 14 can regulate expiry, cancellation and renewal of qualifying fixed-term consumer agreements. A blanket ban on cancellation, full-balance penalty or renewal mechanism without the required notice deserves urgent review.',
    rec:'Check whether CPA section 14 applies. Ask for the cancellation mechanism, notice window and any penalty to be stated clearly and limited to a reasonable amount.',
    impact:'You may face an avoidable cancellation charge or unwanted renewal. Quantify the maximum rand amount from the remaining term before signing.'
  },
  {
    id:'cpa-notice',
    laws:['CPA s49','CPA s22'],
    severity:'HIGH RISK', score:82, tags:['CPA','Disclosure'],
    patterns:[/(indemnity|waiver|assumption of risk).{0,100}(deemed|automatically|by using|by entering)/i,/(risk|liability).{0,70}(fine print|terms and conditions apply)/i],
    fb:'Risk, waiver or indemnity language may not be sufficiently prominent or explained.',
    analysis:'CPA sections 49 and 22 require certain risk, indemnity and liability terms to be drawn to a consumer’s attention in conspicuous, plain language before agreement.',
    rec:'Require the supplier to identify the exact waiver/indemnity, explain it before signature and obtain specific acknowledgement where required.',
    impact:'A hidden or poorly disclosed risk term can create a dispute over enforceability and who bears a loss.'
  },
  {
    id:'rha-deposit-process',
    laws:['Rental Housing Act s5(3)(c)-(g)'],
    severity:'MEDIUM RISK', score:74, tags:['RHA','Deposit'],
    patterns:[/deposit.{0,90}(returned|refund).{0,30}(30|thirty|60|sixty)s+days/i,/deposit.{0,80}(administration fee|admin fee|cleaning fee).{0,40}(automatic|regardless|non[- ]refundable)/i,/tenant.{0,80}(waive|no right).{0,40}(inspection|joint inspection)/i],
    fb:'Deposit return, deduction or inspection process may prejudice the tenant.',
    analysis:'The Rental Housing Act regulates deposits, inspections, deductions and repayment. Automatic deductions or broad inspection waivers can undermine the statutory process.',
    rec:'Require itemised, evidenced deductions; preserve joint inspection rights; and state the applicable repayment timeline and interest treatment.',
    impact:'Potential loss or delay of the rental deposit and a dispute before the Rental Housing Tribunal.'
  },
  {
    id:'employment-deductions',
    laws:['BCEA s34'],
    severity:'HIGH RISK', score:83, tags:['BCEA','Pay'],
    patterns:[/deduct.{0,60}(any amount|at discretion|without consent|without notice)/i,/employee.{0,50}(liable|responsible).{0,40}(all losses|all damage).{0,40}(deduct|salary|wage)/i],
    fb:'Broad salary deduction or employee-loss clause.',
    analysis:'BCEA section 34 restricts deductions from remuneration. Broad advance consent for unspecified losses or employer-discretion deductions can be problematic.',
    rec:'Limit deductions to amounts and circumstances permitted by law, with the required written agreement or lawful basis and a transparent calculation.',
    impact:'Direct take-home-pay exposure. Identify the maximum possible deduction and whether the clause creates uncapped liability.'
  },
  {
    id:'employment-leave',
    laws:['BCEA ch 3'],
    severity:'HIGH RISK', score:81, tags:['BCEA','Leave'],
    patterns:[/no (annual|sick|family responsibility) leave/i,/(annual|sick) leave.{0,50}(waive|forfeit all|not entitled)/i],
    fb:'Statutory leave appears excluded or broadly waived.',
    analysis:'Minimum leave entitlements under the BCEA cannot simply be contracted away where the Act applies.',
    rec:'Replace the waiver with leave terms that meet or exceed the applicable statutory minimum and explain accrual, approval and carry-over clearly.',
    impact:'Lost paid leave and a potential employment dispute.'
  },
  {
    id:'restraint',
    laws:['Common law','Magna Alloys principle'],
    severity:'HIGH RISK', score:80, tags:['Employment','Restraint'],
    patterns:[/restraint of trade.{0,140}(24|36|48|60)s+months/i,/non[- ]compete.{0,100}(south africa|worldwide|anywhere).{0,100}(24|36|48|60)s+months/i,/restraint.{0,80}(all industries|any business|any employment)/i],
    fb:'Restraint may be unusually broad in duration, geography or activity.',
    analysis:'South African restraint clauses are generally enforceable unless unreasonable, with reasonableness assessed in context. Very broad geography, duration or activity can materially restrict future work.',
    rec:'Identify the legitimate interest being protected, then narrow duration, territory, customers and prohibited activities to that interest.',
    impact:'Could restrict your ability to work or trade after termination and create urgent litigation risk.'
  },
  {
    id:'ip-assignment',
    laws:['Copyright Act 98 of 1978','Common law'],
    severity:'MEDIUM RISK', score:69, tags:['IP','Commercial'],
    patterns:[/(assigns?|transfers?).{0,80}(all|any).{0,30}(intellectual property|copyright|inventions).{0,80}(before|pre-existing|prior)/i,/(intellectual property|copyright).{0,80}(in perpetuity|worldwide).{0,80}(all work|anything created)/i],
    fb:'IP assignment may capture pre-existing or unrelated intellectual property.',
    analysis:'An over-broad IP assignment can transfer valuable pre-existing materials, tools or future work beyond the intended project.',
    rec:'Carve out background IP and unrelated work; define project deliverables; grant only the licence or assignment actually required.',
    impact:'Potential permanent loss of ownership or reuse rights in valuable work product.'
  },
  {
    id:'payment-acceleration',
    laws:['CPA s48','Common law'],
    severity:'MEDIUM RISK', score:72, tags:['Payment','Commercial'],
    patterns:[/(all amounts|entire balance|full balance).{0,50}(immediately due|due and payable).{0,70}(breach|late|default)/i,/acceleration.{0,80}(entire|all|full).{0,30}(balance|fees|charges)/i],
    fb:'A default may accelerate the full remaining balance.',
    analysis:'Acceleration can turn a small breach into immediate liability for the entire remaining contract value and may be unfair in a consumer context depending on circumstances.',
    rec:'Add a cure period, limit acceleration to material uncured breach, and calculate the maximum amount that could become immediately due.',
    impact:'Potential immediate cash-flow exposure equal to the unpaid balance of the agreement.'
  },
  {
    id:'penalty',
    laws:['Conventional Penalties Act 15 of 1962','CPA s48'],
    severity:'MEDIUM RISK', score:70, tags:['Penalty','Payment'],
    patterns:[/(penalty|liquidated damages).{0,80}(per day|per week|per month|%|percent)/i,/(late fee|penalty fee).{0,60}(non[- ]refundable|in addition to all|without limit)/i],
    fb:'Penalty or liquidated-damages clause could create disproportionate exposure.',
    analysis:'Contractual penalties can be reduced by a court when disproportionate to prejudice suffered, and consumer terms may also be assessed for fairness.',
    rec:'Ask for a cap, a cure period and a clear relationship between the charge and likely loss. Calculate the worst-case amount over a realistic breach period.',
    impact:'Potential recurring rand liability that can compound quickly.'
  },
  {
    id:'jurisdiction-arbitration',
    laws:['Arbitration Act 42 of 1965','CPA s48'],
    severity:'MEDIUM RISK', score:66, tags:['Disputes'],
    patterns:[/(exclusive jurisdiction|submit to jurisdiction).{0,80}(foreign|england|united states|new york|london|singapore)/i,/arbitration.{0,100}(costs borne by|all costs).{0,50}(consumer|employee|tenant|you)/i],
    fb:'Dispute clause may make enforcement expensive or impractical.',
    analysis:'Forum, arbitration and cost-allocation clauses can materially change the practical cost of enforcing rights even where substantive rights remain.',
    rec:'Prefer a practical South African forum for a South African transaction and balanced allocation of arbitration costs. Check mandatory statutory forums that cannot be excluded.',
    impact:'Higher dispute costs, travel or procedural barriers if enforcement becomes necessary.'
  },
  {
    id:'surety',
    laws:['General Law Amendment Act 50 of 1956 s6','Common law'],
    severity:'HIGH RISK', score:87, tags:['Surety','Personal liability'],
    patterns:[/(surety|co[- ]principal debtor).{0,100}(unlimited|all amounts|any amounts|continuing)/i,/binds? (himself|herself|the signatory).{0,80}(surety|co[- ]principal debtor)/i],
    fb:'The signatory may be accepting personal surety or co-principal-debtor liability.',
    analysis:'A suretyship can expose a person to another party’s debt. Wording that also makes the surety a co-principal debtor can materially affect enforcement and defences.',
    rec:'Do not treat this as boilerplate. Identify the secured debt, cap the amount and duration, specify release events, and obtain independent legal advice before accepting personal liability.',
    impact:'Potential personal liability for another party’s debt, interest and enforcement costs.'
  },
  {
    id:'guarantee-uncapped',
    laws:['Common law','CPA s48 where applicable'],
    severity:'HIGH RISK', score:85, tags:['Guarantee','Liability'],
    patterns:[/(guarantee|indemnity).{0,100}(unlimited|uncapped|all losses|any loss|on demand)/i],
    fb:'Guarantee or indemnity may create uncapped liability.',
    analysis:'An uncapped guarantee or indemnity can shift losses far beyond the contract price and may survive termination.',
    rec:'Cap liability, exclude indirect/consequential loss where appropriate, tie recovery to proven loss, and define a survival period.',
    impact:'Potential liability can exceed the contract value; this deserves priority review before signature.'
  },
  {
    id:'missing-governing-law',
    laws:['Contract certainty / dispute planning'],
    severity:'LOW RISK', score:42, tags:['Missing protection'],
    patterns:[/THIS_PATTERN_IS_NEVER_MATCHED/],
    fb:'No governing-law clause detected.',
    analysis:'For cross-border or multi-jurisdiction agreements, silence on governing law can increase uncertainty and dispute cost.',
    rec:'If the transaction has cross-border elements, add an appropriate governing-law and forum clause after legal review.',
    impact:'Uncertainty about which legal system and forum will govern a dispute.'
  }
];


const UK_RULES = [
  {
    id: 'uk-deposit-cap',
    laws: ['Tenant Fees Act 2019', 'Housing Act 2004'],
    severity: 'HIGH RISK',
    score: 88,
    tags: ['UK', 'Tenancy'],
    patterns: [
      /deposit.{0,40}(more\s+than|exceed|over).{0,20}(5|five)\s+weeks/i,
      /security\s+deposit.{0,30}(6|six|8|eight)\s+weeks/i,
      /deposit.{0,30}non[- ]?refundable/i,
      /eight\s+weeks?\s+rent/i,
    ],
    fb: 'Deposit above legal cap or non-refundable.',
    analysis: 'In England, the Tenant Fees Act 2019 caps tenancy deposits (typically 5 weeks\' rent where annual rent is under £50,000). Non-refundable deposits are generally not a lawful substitute for a protected deposit.',
    rec: 'Cap the deposit at the legal maximum and protect it in an authorised scheme with prescribed information within 30 days.',
    impact: 'Deposit protection claim; possible statutory penalties.',
  },
  {
    id: 'uk-s21-trap',
    laws: ['Renters’ Rights Act 2025', 'Housing Act 1988'],
    severity: 'MEDIUM RISK',
    score: 70,
    tags: ['UK', 'Tenancy'],
    patterns: [
      /evict.{0,40}without\s+(reason|grounds)/i,
      /terminate.{0,30}without\s+(reason|cause)/i,
      /section\s*21.{0,40}(any\s+time|immediately)/i,
    ],
    fb: 'No-fault eviction language without compliance context.',
    analysis: 'For England’s private assured tenancies, Section 21 no-fault eviction was abolished from 1 May 2026 under the Renters’ Rights Act 2025. Possession generally requires a statutory ground and the applicable notice and court process. Historical agreements and transitional cases need individual review.',
    rec: 'Check the current possession grounds, notice periods and court process with a qualified adviser. Do not rely on a new Section 21 notice for an England private assured tenancy.',
    impact: 'Invalid notice; delayed possession; costs.',
  },
  {
    id: 'uk-wtr',
    laws: ['Working Time Regulations 1998', 'Employment Rights Act 1996'],
    severity: 'HIGH RISK',
    score: 84,
    tags: ['UK', 'Employment'],
    patterns: [
      /waive(s|r)?.{0,30}(working\s+time|48[- ]hour|rest\s+break)/i,
      /work\s+(50|55|60)\s+hours?\s+per\s+week/i,
      /no\s+rest\s+breaks?/i,
    ],
    fb: 'Working time / rest break waiver or excessive hours.',
    analysis: 'The Working Time Regulations limit average weekly working time and require rest breaks. Opt-outs from the 48-hour average must be voluntary and in writing.',
    rec: 'Use a voluntary, separate 48-hour opt-out if needed. Guarantee rest breaks as required by law.',
    impact: 'Employment tribunal claims; health & safety exposure.',
  },
  {
    id: 'uk-unfair',
    laws: ['Consumer Rights Act 2015', 'Unfair Contract Terms Act 1977'],
    severity: 'HIGH RISK',
    score: 86,
    tags: ['UK', 'Consumer'],
    patterns: [
      /exclude(s|all)?.{0,30}(liability|responsibility).{0,40}(negligence|death|personal\s+injury)/i,
      /no\s+refunds?\s+under\s+any\s+circumstances/i,
      /waives?.{0,30}(statutory|legal)\s+rights/i,
    ],
    fb: 'Attempt to exclude liability / statutory consumer rights.',
    analysis: 'The Consumer Rights Act 2015 and UCTA restrict exclusion of liability for negligence causing death or personal injury and unfair terms in consumer contracts.',
    rec: 'Remove statutory-rights waivers. Limit exclusions to what the law allows.',
    impact: 'Unenforceable terms; regulatory action; refund claims.',
  },
  {
    id: 'uk-gdpr',
    laws: ['UK GDPR', 'Data Protection Act 2018'],
    severity: 'HIGH RISK',
    score: 85,
    tags: ['UK', 'Privacy'],
    patterns: [
      /consent.{0,40}(sell|share|transfer).{0,40}(personal\s+data|data).{0,30}(marketing|third)/i,
      /selling\s+personal\s+data/i,
      /personal\s+data.{0,40}(sold|shared\s+with\s+third)/i,
    ],
    fb: 'Broad consent to sell/share personal data for marketing.',
    analysis: 'UK GDPR requires a lawful basis and purpose limitation. Blanket consent to sell personal data for marketing is high-risk.',
    rec: 'Separate marketing consent; allow easy withdrawal; minimise data shared.',
    impact: 'ICO complaint; fines; loss of trust.',
  },
];

function analyseContract(text, fileName = '', jurisdiction = 'ZA') {
  if (!text || text.length < 20) {
    return {
      score: 0,
      level: 'Low Risk',
      issuesCount: 0,
      exposure: '—',
      docTitle: fileName || 'Document',
      docType: 'Unknown',
      issues: [],
      highlightedClauses: [],
      rulesVersion: RULES_VERSION,
      jurisdiction: 'ZA',
    };
  }

  const isUK = String(jurisdiction || 'ZA').toUpperCase() === 'UK';
  const pack = isUK ? UK_RULES : RULES;
  const packVersion = isUK ? '1.1-uk-2026' : RULES_VERSION;
  const employment = /employment|employee|employer|salary|remuneration/i.test(text);
  const tenancy = /lease|tenancy|landlord|tenant/i.test(text);
  const found = [];
  const seen = new Set();

  for (const rule of pack) {
    if (seen.has(rule.id)) continue;
    if (['bcea','lra','uk-wtr'].includes(rule.id) && !employment) continue;
    if (['rha-entry','rha-dep','uk-deposit-cap','uk-s21-trap'].includes(rule.id) && !tenancy) continue;
    if (['cpa-unfair','onesided'].includes(rule.id) && employment) continue;
    for (const pattern of rule.patterns) {
      // Examine every occurrence: a protective first clause must not mask a later waiver.
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      let match;
      for (const candidate of matches) {
        const before = text.slice(Math.max(0, candidate.index - 110), candidate.index);
        const prefix = before.split(/[.!?;\n]/).pop();
        const clause = (prefix + candidate[0] + text.slice(candidate.index + candidate[0].length, candidate.index + candidate[0].length + 65)).split(/[.!?;\n]/)[0];
        const protectedPrefix = /\b(nothing|never|not|must not|may not|shall not|does not|do not|cannot|can not|no provision)\b/i.test(prefix);
        const prohibited = /\b(prohibited|forbidden|not permitted|never be sold|will not be sold)\b/i.test(clause);
        if (!protectedPrefix && !prohibited) { match = candidate; break; }
      }
      if (match) {
        seen.add(rule.id);
        const startIdx = Math.max(0, match.index - 40);
        const endIdx = Math.min(text.length, match.index + match[0].length + 80);
        let excerpt = text.slice(startIdx, endIdx).replace(/\s+/g, ' ').trim();
        if (excerpt.length < 20) excerpt = rule.fb;
        found.push({
          id: `${rule.id}-${found.length}`,
          law: rule.laws[0],
          lawRef: rule.laws.join(' • '),
          riskScore: `${rule.score}/100`,
          severity: rule.severity,
          excerpt,
          analysis: rule.analysis,
          recommendation: rule.rec,
          impact: rule.impact,
          tags: rule.tags,
          rawScore: rule.score,
          source: 'rules',
        });
        break;
      }
    }
  }

  const title = `${fileName} ${text.slice(0,500)}`;
  let docType = 'Contract';
  if (/employment|employee|employer|job\s+offer|salary|remuneration/i.test(title)) docType = 'Employment';
  else if (/non[- ]disclosure|\bnda\b|confidentiality\s+agreement/i.test(title)) docType = 'NDA';
  else if (/sale|purchase|seller|buyer/i.test(title)) docType = 'Sale Agreement';
  else if (/lease|tenancy|rental|landlord|tenant|shorthold/i.test(title)) docType = 'Lease / Tenancy';
  else if (/credit|loan|borrower|lender/i.test(title)) docType = 'Loan / Credit';
  else if (/data\s+processing|privacy/i.test(title)) docType = 'Data Processing';
  else if (/services?|consultancy|supplier/i.test(title)) docType = 'Services Agreement';
  else if (/employment|employee|employer|salary/i.test(text)) docType = 'Employment';
  else if (/lease|tenancy|landlord|tenant/i.test(text)) docType = 'Lease / Tenancy';



  // Contextual completeness checks: paid review must also identify important omissions.
  const lower=text.toLowerCase();
  const pushMissing=(id,law,severity,rawScore,analysis,recommendation,impact,tags)=>{
    if(seen.has(id)) return;
    found.push({id:id+'-'+found.length,law,lawRef:law,riskScore:rawScore+'/100',severity,excerpt:'Not found in the extracted contract text',analysis,recommendation,impact,tags,rawScore,source:'completeness'});
    seen.add(id);
  };
  if(!isUK && tenancy){
    if(!/(deposit).{0,180}(interest|interest-bearing)/is.test(text)) pushMissing('missing-deposit-interest','Rental Housing Act s5(3)(c)','MEDIUM RISK',62,'The scan found a residential lease but did not detect clear treatment of interest on the deposit.','Confirm where the deposit is held, the interest treatment, inspection process, permitted deductions and repayment timing.','Unclear deposit handling can make recovery harder at the end of the lease.',['RHA','Missing protection']);
    if(!/(inspection|joint inspection|defects list|inventory)/i.test(text)) pushMissing('missing-lease-inspection','Rental Housing Act s5','MEDIUM RISK',58,'No clear incoming/outgoing inspection process was detected.','Add a documented joint inspection and defects/inventory process with dates and evidence.','Without a clear record, deposit deductions and damage disputes are harder to resolve.',['RHA','Missing protection']);
  }
  if(!isUK && employment){
    if(!/(notice period|notice of termination|termination notice)/i.test(text)) pushMissing('missing-employment-notice','BCEA s37','MEDIUM RISK',57,'No clear termination notice provision was detected.','Confirm the lawful notice period, any probation interaction and the process for termination.','Unclear notice terms can create unexpected income or staffing exposure.',['BCEA','Missing protection']);
    if(!/(annual leave|leave entitlement|leave days)/i.test(text)) pushMissing('missing-employment-leave','BCEA ch 3','MEDIUM RISK',55,'No clear annual-leave entitlement was detected.','State leave entitlement and administration clearly, subject to applicable statutory minimums.','Unclear leave rights create payroll and employment-dispute risk.',['BCEA','Missing protection']);
  }
  if(!/(governed by|governing law|laws of south africa|law of the republic)/i.test(lower) && /international|foreign|usd|gbp|eur|overseas/i.test(lower)){
    pushMissing('missing-governing-law','Contract certainty / dispute planning','LOW RISK',42,'Cross-border indicators were found but no clear governing-law clause was detected.','Clarify governing law and dispute forum before signing.','A dispute may become more expensive and procedurally uncertain.',['Missing protection','Disputes']);
  }

  let score = 18;
  if (found.length) {
    const avg = found.reduce((s, i) => s + i.rawScore, 0) / found.length;
    score = Math.min(95, Math.round(avg * 0.7 + found.length * 8));
  }

  let level = 'Low Risk';
  if (score >= 70) level = 'High Risk';
  else if (score >= 40) level = 'Medium Risk';

  const money=[...text.matchAll(/(?:R|ZAR)\s?([0-9][0-9 ,.]{1,14})/gi)].map(m=>Number(m[1].replace(/[ ,]/g,''))).filter(Number.isFinite);
  const maxMoney=money.length?Math.max(...money):null;
  const severe=found.filter(x=>x.rawScore>=80).length;
  const exposure=maxMoney && severe ? 'At least R'+maxMoney.toLocaleString('en-ZA')+' appears in the contract; exact exposure depends on which obligations apply.' : 'Not safely quantifiable from the extracted terms';
  const critical=found.slice().sort((a,b)=>b.rawScore-a.rawScore).slice(0,3);
  const decision=score>=70?'Do not sign unchanged until the high-risk items are resolved.':score>=40?'Negotiate the flagged items before signing.':'No major red flags were detected by this ruleset, but review the key commercial terms and omissions before signing.';
  const priorities=critical.map(x=>({title:x.law,action:x.recommendation,severity:x.severity}));
  const confidence=found.length?'Evidence-backed flags found in extracted text; completeness is limited by rule coverage and extraction quality.':'No rule match is not a legal clearance; this scan has limited coverage.';
  const coverageWarning = isUK
    ? 'Automated rule-based review. Tenancy checks cover England only; Scotland, Wales and Northern Ireland have different rules. A low score is not a legal clearance. Monetary amounts are context only unless the relevant obligation can be established.'
    : 'Automated rule-based review, not a complete legal opinion. A low score is not a legal clearance. Rand amounts are surfaced as context only; exact legal exposure is not inferred without sufficient contract evidence.';

  return {
    score,
    level,
    issuesCount: found.length,
    exposure,
    decision,
    priorities,
    confidence,
    criticalCount: severe,
    docTitle: fileName ? fileName.replace(/\.[^.]+$/, '') : `${docType} Agreement`,
    docType: `${docType} • analysed just now`,
    issues: found,
    coverageWarning,
    highlightedClauses: found.map((f) => f.excerpt.slice(0, 60)),
    rulesVersion: packVersion,
    jurisdiction: isUK ? 'UK' : 'ZA',
  };
}

module.exports = { analyseContract, RULES, UK_RULES, RULES_VERSION };
