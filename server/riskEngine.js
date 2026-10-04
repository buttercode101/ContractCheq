/**
 * ContractCheck risk engine v3 — ZA + UK
 * Check & Flag Only. Not legal advice.
 */
const RULES_VERSION = '3.0-sa-2026';

const RULES = [
  {
    id: 'rha-entry',
    laws: ['Rental Housing Act s4(3)', 'Constitution s14'],
    severity: 'HIGH THREAT',
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
      'Section 14 of the Constitution and the Rental Housing Act protect tenant privacy and quiet enjoyment. Unrestricted entry without notice is an unfair practice. The RHA requires reasonable notice and entry at reasonable times.',
    rec: 'Require at least 24 hours written notice for non-emergency entry. Limit inspections to agreed times.',
    impact: 'Claim for invasion of privacy; possible reduction of rental for impaired use and enjoyment.',
  },
  {
    id: 'rha-dep',
    laws: ['CPA s48 & s51', 'RHA s5(3)(c)'],
    severity: 'HIGH THREAT',
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
    impact: 'Risk of losing full deposit even when not at fault. Exposure up to ~2× monthly rental.',
  },
  {
    id: 'popia',
    laws: ['POPIA s11 & s18', 'POPIA s8'],
    severity: 'HIGH THREAT',
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
    severity: 'HIGH THREAT',
    score: 82,
    tags: ['BCEA', 'LRA'],
    patterns: [
      /(work|working)\s+(\d{2}|fifty|fifty[- ]five|60|sixty)\s+hours?\s+(per\s+)?(week)/i,
      /overtime.{0,50}(without\s+(additional\s+)?(pay|compensation)|unpaid|no\s+extra)/i,
      /waive(s|r)?.{0,35}(meal\s+(interval|break)|right\s+to\s+meal)/i,
      /ordinary\s+hours?.{0,25}(exceed|more\s+than)\s*45/i,
      /55\s+hours?\s+per\s+week/i,
    ],
    fb: 'Excessive weekly hours and/or unpaid overtime / meal-interval waiver.',
    analysis:
      'BCEA limits ordinary hours to 45 per week. Overtime is limited and must be paid at 1.5×. Waiver of meal intervals after 5 hours and a blanket 55-hour week without compensation contravenes s9, s10 and s14; such waivers are void under s2.',
    rec: 'Cap ordinary hours at 45. Provide a separate written overtime agreement with premium pay. Guarantee a 60-minute meal interval after 5 continuous hours.',
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
      /interest\s+rate.{0,35}(per\s+month|pm|p\.m\.)/i,
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
];


const UK_RULES = [
  {
    id: 'uk-deposit-cap',
    laws: ['Tenant Fees Act 2019', 'Housing Act 2004'],
    severity: 'HIGH THREAT',
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
    impact: 'Deposit protection claim; possible penalties; s21 notice risks.',
  },
  {
    id: 'uk-s21-trap',
    laws: ['Housing Act 1988 s21', 'Deregulation Act 2015'],
    severity: 'MEDIUM RISK',
    score: 70,
    tags: ['UK', 'Tenancy'],
    patterns: [
      /evict.{0,40}without\s+(reason|grounds)/i,
      /terminate.{0,30}without\s+(reason|cause)/i,
      /section\s*21.{0,40}(any\s+time|immediately)/i,
    ],
    fb: 'No-fault eviction language without compliance context.',
    analysis: 'Section 21 possession has strict prerequisites (deposit protection, prescribed information, licensing, gas safety, EPC). Bare “evict without reason” wording overstates landlord rights.',
    rec: 'Use lawful notice wording and confirm all statutory prerequisites before any notice is served.',
    impact: 'Invalid notice; delayed possession; costs.',
  },
  {
    id: 'uk-wtr',
    laws: ['Working Time Regulations 1998', 'Employment Rights Act 1996'],
    severity: 'HIGH THREAT',
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
    severity: 'HIGH THREAT',
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
    severity: 'HIGH THREAT',
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
  const packVersion = isUK ? '1.0-uk-2026' : RULES_VERSION;
  const found = [];
  const seen = new Set();

  for (const rule of pack) {
    if (seen.has(rule.id)) continue;
    for (const pattern of rule.patterns) {
      const match = text.match(pattern);
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

  let docType = 'Contract';
  if (/lease|tenancy|rental|landlord|tenant|premises|shorthold/i.test(text) || /lease|tenancy/i.test(fileName))
    docType = 'Lease / Tenancy';
  else if (/employment|employee|employer|job\s+offer|remuneration|salary/i.test(text) || /employ/i.test(fileName))
    docType = 'Employment';
  else if (/nda|non[- ]disclosure|confidential/i.test(text)) docType = 'NDA';
  else if (/sale|purchase|seller|buyer/i.test(text)) docType = 'Sale Agreement';

  let score = 18;
  if (found.length) {
    const avg = found.reduce((s, i) => s + i.rawScore, 0) / found.length;
    score = Math.min(95, Math.round(avg * 0.7 + found.length * 8));
  }

  let level = 'Low Risk';
  if (score >= 70) level = 'High Risk';
  else if (score >= 40) level = 'Medium Risk';

  let exposure = isUK ? '£500 – £3,000' : 'R2,000 – R15,000';
  if (score >= 80) exposure = isUK ? '£10,000 – £50,000' : 'R50,000 – R250,000';
  else if (score >= 60) exposure = isUK ? '£3,000 – £15,000' : 'R15,000 – R80,000';
  else if (score >= 40) exposure = isUK ? '£1,000 – £6,000' : 'R5,000 – R30,000';

  return {
    score,
    level,
    issuesCount: found.length,
    exposure,
    docTitle: fileName ? fileName.replace(/\.[^.]+$/, '') : `${docType} Agreement`,
    docType: `${docType} • analysed just now`,
    issues: found,
    highlightedClauses: found.map((f) => f.excerpt.slice(0, 60)),
    rulesVersion: packVersion,
    jurisdiction: isUK ? 'UK' : 'ZA',
  };
}

module.exports = { analyseContract, RULES, UK_RULES, RULES_VERSION };
