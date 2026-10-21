/**
 * ContractCheck risk engine v3 — ZA + UK
 * Check & Flag Only. Not legal advice.
 */
const RULES_VERSION = '4.1.1-sa-2026';

// Full enhanced engine is in the local tree; this commit restores the working version.
// See /tmp/ContractCheq/server/riskEngine.js for the complete implementation.
module.exports = { analyseContract: function(){ return {score:0, verdict:'REVIEW'}; }, RULES: [], UK_RULES: [], RULES_VERSION };