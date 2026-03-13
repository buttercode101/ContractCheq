function clampScore(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function normalizeRiskLevel(value, score = 0) {
  if (typeof value === 'string') {
    const v = value.trim().toUpperCase();
    if (v === 'LOW' || v === 'MEDIUM' || v === 'HIGH') return v;
  }

  if (score <= 30) return 'LOW';
  if (score <= 70) return 'MEDIUM';
  return 'HIGH';
}

function normalizeFinancialExposure(v, fallbackDescription) {
  if (!v || typeof v !== 'object') {
    return { low: null, high: null, currency: 'ZAR', description: fallbackDescription };
  }

  const lowRaw = v.low ?? v.min ?? v.minimum ?? null;
  const highRaw = v.high ?? v.max ?? v.maximum ?? null;
  const low = lowRaw === null ? null : Number(lowRaw);
  const high = highRaw === null ? null : Number(highRaw);

  return {
    low: Number.isFinite(low) ? low : null,
    high: Number.isFinite(high) ? high : null,
    currency: typeof v.currency === 'string' && v.currency.trim() ? v.currency.trim().toUpperCase() : 'ZAR',
    description: typeof v.description === 'string' && v.description.trim()
      ? v.description.trim()
      : fallbackDescription
  };
}

function normalizeClause(clause, index) {
  const score = clampScore(
    clause?.riskScore ?? clause?.risk_score ?? clause?.score,
    50
  );

  const quote = clause?.clause_quote ?? clause?.clauseText ?? clause?.quote ?? clause?.clause ?? `Clause ${index + 1}`;
  const why = clause?.why_risky ?? clause?.analysis ?? clause?.issue ?? 'Risk detected by model; explanation missing.';
  const todo = clause?.what_to_do ?? clause?.recommendation ?? 'Review with a qualified attorney and negotiate safer wording.';
  const act = clause?.act_reference ?? clause?.actReference ?? clause?.law_reference ?? 'INSUFFICIENT EVIDENCE – REQUIRES HUMAN REVIEW';

  return {
    clause_quote: String(quote),
    risk_level: normalizeRiskLevel(clause?.risk_level ?? clause?.riskLevel, score),
    riskScore: score,
    financial_exposure: normalizeFinancialExposure(
      clause?.financial_exposure ?? clause?.financialExposure,
      'Financial impact estimate unavailable.'
    ),
    why_risky: String(why),
    what_to_do: String(todo),
    act_reference: String(act)
  };
}

export function normalizeAnalysisShape(raw) {
  const risksRaw = raw?.risks ?? raw?.flaggedClauses ?? raw?.flagged_clauses ?? [];
  const risks = Array.isArray(risksRaw) ? risksRaw.map(normalizeClause) : [];

  const overallScore = clampScore(
    raw?.overallRiskScore ?? raw?.overall_risk_score ?? raw?.overallScore,
    risks.length ? Math.round(risks.reduce((a, r) => a + r.riskScore, 0) / risks.length) : 0
  );

  const normalized = {
    overall_risk: normalizeRiskLevel(raw?.overall_risk ?? raw?.overallRisk, overallScore),
    overallRiskScore: overallScore,
    overall_summary: String(
      raw?.overall_summary ?? raw?.summary ?? raw?.overallSummary ?? 'Automated risk scan complete. This is NOT legal advice. Consult a qualified attorney before acting.'
    ),
    financial_exposure_estimate: normalizeFinancialExposure(
      raw?.financial_exposure_estimate ?? raw?.financialExposureEstimate,
      'Estimated exposure based on detected clauses.'
    ),
    risks
  };

  return normalized;
}

export function isValidAnalysisShape(v) {
  if (!v || typeof v !== 'object') return false;
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(v.overall_risk)) return false;
  if (typeof v.overallRiskScore !== 'number') return false;
  if (typeof v.overall_summary !== 'string') return false;
  if (!v.financial_exposure_estimate || typeof v.financial_exposure_estimate !== 'object') return false;
  if (!Array.isArray(v.risks)) return false;

  return v.risks.every((r) =>
    r && typeof r === 'object' &&
    typeof r.clause_quote === 'string' &&
    ['LOW', 'MEDIUM', 'HIGH'].includes(r.risk_level) &&
    typeof r.riskScore === 'number' &&
    typeof r.why_risky === 'string' &&
    typeof r.what_to_do === 'string' &&
    typeof r.act_reference === 'string'
  );
}
