const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPlainLanguageGuide } = require('./plainLanguage');

test('explains ordinary payment obligations, not only flagged legal risks', () => {
  const guide = buildPlainLanguageGuide('SERVICES AGREEMENT\nThe customer shall pay R8,000.50 per calendar month prior to the 5th day.');
  const section = guide.sections.find(s => s.amounts.length);
  assert.ok(section.simplerWording.includes('must pay R8,000.50 each calendar month before the 5th day'));
  assert.deepEqual(section.amounts, ['R8,000.50']);
  assert.ok(section.questions.some(q => q.includes('Who pays whom')));
  assert.ok(section.original.includes('shall'));
});

test('preserves negation, permission, exceptions, amounts and cross-references', () => {
  const original = 'The tenant shall not pay a penalty of R500 unless clause 7.2 applies. The landlord may not renew automatically.';
  const guide = buildPlainLanguageGuide(original);
  assert.ok(guide.sections[0].simplerWording.includes('must not pay'));
  assert.ok(guide.sections[0].simplerWording.includes('unless clause 7.2 applies'));
  assert.deepEqual(guide.sections[0].crossReferences, ['clause 7.2']);
  assert.ok(guide.sections[0].needsReview);
  assert.ok(guide.sections[1].simplerWording.includes('may not renew automatically'));
  assert.ok(guide.sections[1].qualifiers.includes('automatically'));
});

test('defines unfamiliar terms in context without inventing contract amounts or legal findings', () => {
  const guide = buildPlainLanguageGuide('The signatory binds herself as surety and co-principal debtor, jointly and severally liable. Notwithstanding clause 4, the indemnity is irrevocable.');
  assert.ok(guide.glossary.some(t => t.term === 'surety'));
  assert.ok(guide.glossary.some(t => t.term === 'indemnity'));
  assert.ok(guide.sections.every(s => s.amounts.length === 0));
  assert.ok(!JSON.stringify(guide).includes('unenforceable'));
});

test('unknown terms and absent topics remain explicit unknowns', () => {
  const guide = buildPlainLanguageGuide('ZXQ custom arrangement under definition Q.');
  assert.ok(guide.sections[0].needsReview);
  assert.match(guide.sections[0].explanation, /not covered/);
  assert.ok(guide.checklist.every(item => !item.found && item.note.includes('does not prove')));
});

test('long contracts report their coverage limit and retain later sections within it', () => {
  const text = Array.from({ length: 405 }, (_, i) => `The customer shall pay R${i + 100} monthly.\n`).join('');
  const guide = buildPlainLanguageGuide(text);
  assert.equal(guide.coverage.totalSections, 405);
  assert.equal(guide.coverage.includedSections, 400);
  assert.equal(guide.coverage.limited, true);
  assert.ok(guide.sections[399].original.includes('R499'));
});

test('original wording is retained verbatim apart from whitespace and later-page amounts remain exact', () => {
  const guide = buildPlainLanguageGuide('PAYMENT TERMS\nPay £1,250 within 30 calendar days.\nOTHER TERMS\nThe borrower shall repay USD 10,000 in 12 months.');
  assert.ok(guide.sections.some(s => s.original === 'Pay £1,250 within 30 calendar days.'));
  assert.ok(guide.sections.some(s => s.amounts.includes('USD 10,000') && s.timeTerms.includes('12 months')));
});

test('written-number notice periods are surfaced without conversion', () => {
  const guide = buildPlainLanguageGuide('The landlord may terminate on two weeks notice. Payment is due monthly.');
  assert.ok(guide.sections[0].timeTerms.includes('two weeks'));
  assert.ok(guide.sections[1].timeTerms.includes('monthly'));
});
