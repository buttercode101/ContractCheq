/** Evidence-linked reading aid. No external model, legal conclusions or invented terms. */
const VERSION = '1.0';
const TOPICS = [
  ['renewal', 'Renewal and price changes', /renew|escalat|increase|amend|variation|change.{0,25}(price|fee|terms)/i,
    'This part explains whether the deal can continue, become more expensive, or change later.',
    'Can it renew or change without a new signature? What notice is needed to stop that?'],
  ['ending', 'Ending the agreement', /terminat|cancel|notice period|notice of (?:termination|cancellation)|breach|default|expiry|expire/i,
    'This part covers how the deal can end, notice that must be given, or what happens if someone does not keep a promise.',
    'Who can end it, how must notice be sent, and what must still be paid afterwards?'],
  ['deposit', 'Deposit and refund', /deposit|refund|deduction/i,
    'This part covers money held or returned, and any conditions for keeping or paying it back.',
    'When is the money returned, what can be deducted, and what proof is needed?'],
  ['money', 'Payments and extra costs', /\b(?:payments?|payable|pays?|paid|rent|salary|remuneration|fees?|charges?|interest|penalt(?:y|ies)|invoices?|costs?)\b/i,
    'This part covers money someone must pay, money they receive, or extra costs that may apply.',
    'Who pays whom, how much, by which date, and are there extra fees or increases?'],
  ['guarantee', 'Personal responsibility for someone else', /surety|guarant|co[- ]principal|joint(?:ly)? and several/i,
    'This wording concerns responsibility for a debt or promise, potentially including another person’s or business’s debt. Check exactly who signs and in what role.',
    'Could the signer have to pay personally? Is there a money limit and a clear way to be released?'],
  ['liability', 'Losses, damage and claims', /liab|indemn|hold harmless|negligen|damages|losses|consequential/i,
    'This part deals with who may have to cover losses, damage or claims, and any limits or exclusions.',
    'Whose losses are covered, what is excluded, and is the amount limited?'],
  ['rights', 'Giving up or keeping rights', /waiv|rights|remed(?:y|ies)|without prejudice/i,
    'This part deals with rights someone keeps, limits or agrees not to use. Read words such as “not” and any exceptions carefully.',
    'Which right is affected, and does agreeing stop someone from making a claim later?'],
  ['privacy', 'Personal information', /personal (?:data|information)|privacy|consent|biometric|marketing|\bdata\b/i,
    'This part covers collecting, using or sharing information, and any permission being requested.',
    'What information is used, for what purpose, with whom, for how long, and can permission be withdrawn?'],
  ['confidentiality', 'Keeping information private', /confiden|non[- ]disclosure|trade secret/i,
    'This part limits what information can be shared or used, and may continue after the deal ends.',
    'What must stay private, what exceptions apply, and when does this duty end?'],
  ['ownership', 'Ownership of work and ideas', /intellectual property|copyright|\bIP\b|licen[cs]e|assign(?:ment|s)?|ownership/i,
    'This part concerns who owns something or who is allowed to use it. A right to use something is not necessarily ownership.',
    'Who owns existing work and new work? Does the other party get ownership or only permission to use it?'],
  ['work', 'Work, time and restrictions', /\bovertime\b|\bworking (?:hours|time|conditions|days)\b|\bhours(?: per| a) (?:week|day)\b|\b(?:annual|paid|sick|maternity|paternity|parental) leave\b|\bemployee\b.{0,80}\bleave\b|\bleave\b.{0,80}\bemployee\b|\bprobation\b|\brestraint\b|\bnon[- ]compete\b/i,
    'This part covers working conditions, time off, pay-related work duties, or limits on other work.',
    'What work and hours are expected, what time off is provided, and do any restrictions continue after leaving?'],
  ['property', 'Using and looking after property', /\b(?:entry|inspect\w*|repairs?|maintenance)\b|\b(?:enter|access)\b.{0,40}\b(?:premises|dwelling|property|home|house|flat|apartment)\b|\b(?:premises|dwelling|property)\b.{0,40}\baccess\b/i,
    'This part covers using, entering, inspecting or looking after property.',
    'Who can enter, who must fix or pay for problems, and how are condition and repairs recorded?'],
  ['disputes', 'Disagreements and where to resolve them', /arbitrat|jurisdiction|governing law|court|dispute|mediat/i,
    'This part sets out where or how a disagreement is handled, and may name the law or process to use.',
    'Where must a dispute be handled, what process comes first, and who pays its costs?'],
  ['duration', 'Start date and length', /commenc|effective|start date|duration|fixed term|period of|months|years/i,
    'This part concerns when an obligation begins, how long it lasts, or a time period that applies.',
    'What starts the time period, when does it end, and are these calendar or working days?'],
  ['obligation', 'Promises and responsibilities', /\bshall\b|\bmust\b|\bagrees? to\b|undertakes?|obligat|deliver|provide/i,
    'This part describes something a party promises to do or is required not to do.',
    'Who has to do it, by when, to what standard, and what happens if they do not?'],
];

const TERMS = [
  ['non-refundable', /\bnon-refundable\b/i, 'The agreement says the money will not be paid back in the circumstances described. Read the conditions; this does not decide whether keeping it is legally allowed.'],
  ['automatic renewal', /automat(?:ic|ically).{0,30}renew|renew.{0,30}automat(?:ic|ically)/i, 'The deal may continue for another period without a new signature if the stated conditions apply. Check how and when to stop it.'],
  ['accrue', /\baccru(?:e|es|ed|ing)\b/i, 'Build up over time, often used for interest, leave or a right to payment.'],
  ['statutory', /\bstatutory\b/i, 'Set out in legislation. The word alone does not tell you the amount, rule or whether it applies to this agreement.'],
  ['shall', /\bshall\b/i, 'Usually introduces a requirement: read it as “must”. Keep any “not”, conditions and exceptions.'],
  ['may', /\bmay\b/i, 'Can indicate permission or a possibility. It does not by itself mean something must happen.'],
  ['indemnity', /indemn(?:ity|ify|ifies|ified)/i, 'An agreement about covering losses or claims. Check whose losses, which events and any limits.'],
  ['surety', /\bsurety\b/i, 'Someone who agrees to take responsibility for another party’s debt or obligation if the stated conditions apply.'],
  ['co-principal debtor', /co[- ]principal debtor/i, 'Wording about sharing responsibility for a debt with the main debtor. Get advice on the exact responsibility before signing.'],
  ['joint and several', /joint(?:ly)? and several(?:ly)?/i, 'Wording that can allow a claim against one responsible party for the whole amount, rather than only a share.'],
  ['waiver', /waiv(?:e|es|er|ing)/i, 'Giving up or agreeing not to use a right. Check the exact right and any limits.'],
  ['breach', /\bbreach\b/i, 'Not keeping a promise or requirement in the agreement.'],
  ['default', /\bdefault\b/i, 'A failure described in the agreement, often a missed payment or another unmet duty.'],
  ['notwithstanding', /\bnotwithstanding\b/i, 'Signals that this wording is meant to apply even if other wording points in a different direction.'],
  ['subject to', /\bsubject to\b/i, 'The statement depends on, or is limited by, another condition or provision. Read the linked wording too.'],
  ['deemed', /\bdeemed\b/i, 'Treated as true for the agreement, sometimes even if it did not actually happen in the usual way.'],
  ['domicilium', /\bdomicilium\b/i, 'An address chosen for formal notices or legal documents. Check how to change it.'],
  ['in perpetuity', /\bin perpetuity\b/i, 'Without a stated end date. Check whether that is really what you intend to accept.'],
  ['irrevocable', /\birrevocab\w*/i, 'Describes something intended not to be withdrawn or cancelled. Check its scope and any exceptions.'],
  ['cession', /\bcession\b|\bcede[sd]?\b/i, 'Wording about transferring rights to someone else. Check which rights and whether permission is needed.'],
  ['arbitration', /\barbitrat\w*/i, 'A process where an appointed decision-maker deals with a dispute outside the usual court hearing process. Check the rules and costs.'],
  ['without prejudice', /\bwithout prejudice\b/i, 'A phrase whose effect depends on the context. It can concern keeping rights or settlement discussions; do not assume one meaning.'],
  ['force majeure', /\bforce majeure\b/i, 'A clause about specified events outside a party’s control. Check which events, duties and deadlines it actually covers.'],
];

const REPLACEMENTS = [
  [/\bshall\b/gi, 'must'], [/\bpursuant to\b/gi, 'under'],
  [/\bprior to\b/gi, 'before'], [/\bsubsequent to\b/gi, 'after'],
  [/\bin the event that\b/gi, 'if'], [/\bin the event of\b/gi, 'if there is'],
  [/\bfor the avoidance of doubt\b/gi, 'to be clear'],
  [/\bhereinafter referred to as\b/gi, 'called'], [/\bhereby\b/gi, 'by this agreement'],
  [/\bcommence(?:ment)?\b/gi, 'start'], [/\bterminate\b/gi, 'end'],
  [/\btermination\b/gi, 'ending the agreement'], [/\bremuneration\b/gi, 'pay'],
  [/\butili[sz]e\b/gi, 'use'], [/\bper annum\b/gi, 'per year'],
  [/\bper calendar month\b/gi, 'each calendar month'], [/\bforthwith\b/gi, 'immediately'],
  [/\bwaives\b/gi, 'gives up'], [/\bwaive\b/gi, 'give up'],
  [/\baccrue\b/gi, 'build up'], [/\baccrues\b/gi, 'builds up'],
  [/\bstatutory minimum\b/gi, 'minimum set by law'],
  [/\bnon-refundable\b/gi, 'not refundable (not paid back)'],
];
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const unique = values => [...new Set(values)];

function segments(text) {
  const out = [];
  // Keep decimal numbers and numbered references intact. No text is silently dropped.
  for (const paragraph of String(text).split(/\r?\n+/)) {
    for (const sentence of paragraph.split(/(?<=[.!?;])\s+(?=[A-Z])/)) {
      const words = clean(sentence).split(' ');
      let chunk = '';
      for (const word of words) {
        if (chunk && chunk.length + word.length > 1100) { out.push(chunk); chunk = ''; }
        chunk += (chunk ? ' ' : '') + word;
      }
      if (chunk) out.push(chunk);
    }
  }
  return out;
}

function buildPlainLanguageGuide(text, docType = 'Contract') {
  const all = segments(text);
  const selected = all.slice(0, 400);
  const sections = selected.map((original, index) => {
    const matches = TOPICS.filter(([, , pattern]) => pattern.test(original));
    if (!matches.length && original.length < 120 && /\b(?:agreement|contract|offer)\b/i.test(original) && !/\b(?:shall|must|may|will|agrees?|hereby)\b/i.test(original)) {
      matches.push(['heading', 'Agreement heading', null,
        'This is a document heading. It names the kind of agreement; the wording below sets out the actual promises and conditions.',
        'Are the parties, agreement type and included attachments the ones you expect?']);
    }
    const glossary = TERMS.filter(([, pattern]) => pattern.test(original)).map(([term, , meaning]) => ({ term, meaning }));
    let simplerWording = original;
    for (const [pattern, replacement] of REPLACEMENTS) simplerWording = simplerWording.replace(pattern, replacement);
    const amounts = unique(original.match(/(?:\b(?:ZAR|USD|GBP|EUR|R)\s*|[£$€])\d[\d ,]*(?:\.\d{1,2})?/g) || []).map(clean);
    const timeTerms = unique(original.match(/\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|fourteen|thirty|sixty|ninety)\s*(?:(?:business|working|calendar)\s+)?(?:hours?|days?|weeks?|months?|years?)\b|\b(?:daily|weekly|monthly|annually)\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi) || []);
    const crossReferences = unique(original.match(/\b(?:clause|section|schedule|annexure|appendix)\s+[A-Za-z0-9]+(?:\.\d+)*/gi) || []);
    const qualifiers = unique(original.match(/\b(?:unless|except|provided that|subject to|notwithstanding|only if|without notice|automatically|irrevocable|non-refundable|deemed)\b/gi) || []);
    return {
      id: 'wording-' + (index + 1), sourceLabel: 'Text section ' + (index + 1), original,
      title: matches.length ? matches.slice(0, 2).map(([, title]) => title).join(' / ') : 'Wording to review',
      simplerWording, wordingChanged: simplerWording !== original,
      explanation: matches.length ? matches.slice(0, 3).map(([, , , explanation]) => explanation).join(' ') : 'This wording is not covered by the topic explanations. Ask the other party to explain its purpose and effect in writing before relying on it.',
      questions: unique(matches.map(([, , , , question]) => question)).slice(0, 3),
      amounts, timeTerms, crossReferences, qualifiers, glossary,
      needsReview: !matches.length || crossReferences.length > 0,
      topics: matches.map(([key]) => key),
    };
  });
  const topicSet = new Set(sections.flatMap(section => section.topics));
  const checklist = [
    ['money', 'Payments and extra costs'], ['duration', 'Start date and length'],
    ['ending', 'Cancellation and notice'], ['renewal', 'Renewal and changes'],
    ['liability', 'Responsibility for losses'], ['disputes', 'Dispute process'],
  ].map(([topic, title]) => ({ title, found: topicSet.has(topic),
    note: topicSet.has(topic) ? 'Related wording found. Read the linked text sections.' : 'No related wording recognised. This does not prove it is absent; check the complete agreement.' }));
  return {
    version: VERSION, method: 'source-linked reading guide',
    overview: `A reading guide to this ${docType.toLowerCase()}. It separates the wording into small sections so you can check each promise, cost and condition. It does not assume which party you are.`,
    coverage: { totalSections: all.length, includedSections: sections.length, limited: all.length > selected.length,
      needsReview: sections.filter(section => section.needsReview).length },
    caveat: 'A reading aid, not a replacement contract or a legal opinion. Topic explanations describe what to check; they do not decide whether a term is valid or enforceable. Negations, exceptions, definitions and linked clauses still matter. Only extracted text is covered; unreadable text and missing attachments are not explained.',
    sections, checklist,
    glossary: unique(sections.flatMap(section => section.glossary.map(term => term.term)))
      .map(term => sections.flatMap(section => section.glossary).find(entry => entry.term === term)),
  };
}

module.exports = { buildPlainLanguageGuide };
