/** Offline smoke test — no server required */
const { analyseContract } = require('./riskEngine');

const lease = `Residential Lease. Landlord may enter premises at any time without notice for inspection.
Deposit is non-refundable under all circumstances. No interest will accrue.
Tenant consents to selling ID number and biometric data to marketing partners.`;

const uk = `Assured shorthold tenancy. Security deposit equal to eight weeks rent. Deposit is non-refundable.
Landlord may terminate without reason. Tenant consents to selling personal data to marketing partners.
Landlord excludes all liability for negligence including personal injury.`;

const za = analyseContract(lease, 'lease.pdf', 'ZA');
const ukr = analyseContract(uk, 'tenancy.pdf', 'UK');

console.log('ZA score', za.score, 'issues', za.issuesCount, 'level', za.level);
console.log('UK score', ukr.score, 'issues', ukr.issuesCount, 'jurisdiction', ukr.jurisdiction);

if (za.issuesCount < 2) {
  console.error('FAIL: expected SA issues');
  process.exit(1);
}
if (ukr.issuesCount < 2) {
  console.error('FAIL: expected UK issues');
  process.exit(1);
}
console.log('SMOKE OK');
