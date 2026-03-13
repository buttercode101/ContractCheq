import { normalizeAnalysisShape, isValidAnalysisShape } from '../lib/analysisNormalizer.js';

const fixtures = [
  {
    name: 'canonical-shape',
    input: {
      overall_risk: 'HIGH',
      overallRiskScore: 91,
      overall_summary: 'Risky contract',
      financial_exposure_estimate: { low: 1000, high: 5000, currency: 'ZAR', description: 'Estimated' },
      risks: [
        {
          clause_quote: 'Clause text',
          risk_level: 'HIGH',
          riskScore: 90,
          financial_exposure: { low: 1000, high: 2000, description: 'Exposure' },
          why_risky: 'Reason',
          what_to_do: 'Fix',
          act_reference: 'CPA s48'
        }
      ]
    }
  },
  {
    name: 'variant-shape',
    input: {
      overallRisk: 'medium',
      overallScore: '55',
      summary: 'Summary',
      financialExposureEstimate: { min: '100', max: '200', description: 'desc' },
      flaggedClauses: [
        {
          clauseText: 'Quote',
          riskLevel: 'low',
          score: '23',
          analysis: 'why',
          recommendation: 'do',
          actReference: 'POPIA s13'
        }
      ]
    }
  },
  {
    name: 'empty-shape',
    input: {}
  }
];

for (const fixture of fixtures) {
  const normalized = normalizeAnalysisShape(fixture.input);
  if (!isValidAnalysisShape(normalized)) {
    console.error('FAILED', fixture.name, normalized);
    process.exit(1);
  }
}

console.log('normalizer tests passed');
