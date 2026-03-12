export const config = {
  runtime: 'nodejs'
};

const SYSTEM_PROMPT = `You are a senior South African attorney with 20+ years of experience in consumer, employment, rental housing, and data protection law. You ONLY analyse contracts under current South African statutes and case law as of March 2026. You NEVER hallucinate clauses, cases, or interpretations that do not exist. If something is unclear, ambiguous, or outside your knowledge, state "INSUFFICIENT EVIDENCE – REQUIRES HUMAN REVIEW" instead of guessing.

Your sole task is to perform a clause-by-clause risk audit on the provided contract text. Follow these strict rules:

1. Identify EVERY potentially unfair, unlawful, risky, missing, or ambiguous clause.
2. Reference ONLY real, current SA law:
   - Basic Conditions of Employment Act (BCEA) 1997 (as amended)
   - Consumer Protection Act (CPA) 2008
   - Protection of Personal Information Act (POPIA) 2013
   - Rental Housing Act (RHA) 1999 & Regulations
   - Labour Relations Act (LRA) 1995
   - National Credit Act (NCA) 2005
   - Common law principles (good faith, ubuntu, public policy)
3. For EVERY flagged item:
   - Quote the EXACT clause text.
   - Assign a numerical riskScore (0-100).
   - Assign risk level LOW / MEDIUM / HIGH.
   - Estimate Rand financial exposure range.
   - Explain why risky in plain concise English.
   - Provide practical fix language.
   - Include exact Act/section reference.
4. Output JSON ONLY.`;

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function isValidAnalysisShape(v) {
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

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

async function callGroqAnalyze(text, retry = false) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is missing in server environment.');

  const userPrompt = `Analyze this contract and return JSON only using fields: overall_risk, overallRiskScore, overall_summary, financial_exposure_estimate, risks. Contract:\n---\n${text.slice(0, 32000)}\n---`;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt + (retry ? '\nIMPORTANT: Return strictly valid JSON only.' : '') }
      ]
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq request failed (${resp.status}): ${err.slice(0, 180)}`);
  }

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty content.');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    if (!retry) return callGroqAnalyze(text, true);
    throw new Error('Groq returned invalid JSON after retry.');
  }

  if (!isValidAnalysisShape(parsed)) {
    if (!retry) return callGroqAnalyze(text, true);
    throw new Error('Groq JSON schema validation failed.');
  }

  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    const body = await readJsonBody(req);
    const text = String(body.text || '').trim();
    if (!text) return send(res, 400, { error: 'text is required.' });

    const analysis = await callGroqAnalyze(text);
    return send(res, 200, { analysis });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : 'Internal server error' });
  }
}
