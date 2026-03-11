
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export async function analyzeContract(contractText: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const injectionPatterns = /ignore (previous|all) instructions|system prompt|<\|im_start\|>|<\|im_end\|>/i;
  if (injectionPatterns.test(contractText)) {
    throw new Error('Potential security risk detected. We cannot process this document.');
  }

  const systemPrompt = `You are a senior South African attorney with 20+ years of experience in consumer, employment, rental housing, and data protection law. You ONLY analyse contracts under current South African statutes and case law as of March 2026. You NEVER hallucinate clauses, cases, or interpretations that do not exist. If something is unclear, ambiguous, or outside your knowledge, state "INSUFFICIENT EVIDENCE – REQUIRES HUMAN REVIEW" instead of guessing.

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
   - Relevant tribunal/CCMA/High Court precedents (use only widely known cases or general principles if specific citation unavailable)
3. For EVERY flagged item:
   - Quote the EXACT clause text.
   - Assign a numerical riskScore (0-100) where 0 is no risk and 100 is critical/illegal.
   - Assign risk level: LOW / MEDIUM / HIGH (based on the score: 0-30 LOW, 31-70 MEDIUM, 71-100 HIGH).
   - Calculate realistic Rand financial exposure range (low-high) based on typical SA tribunal awards, CCMA settlements, or statutory penalties (e.g., BCEA overtime = up to 1.5× rate + backpay; unfair lease deposit = full refund + damages).
   - Explain "WHY IT'S RISKY" in plain, concise English (1–3 sentences max).
   - Provide "WHAT TO DO" practical fix or negotiation language (copy-paste ready for WhatsApp/email).
   - Link to the specific Act/section (e.g., BCEA s 9–10 on ordinary hours).
4. Output ONLY in structured JSON format – no extra text outside the JSON.
5. If no risks found: return { "risks": [], "overall_risk": "LOW", "overallRiskScore": 0, "overall_summary": "No material issues detected under SA law.", "financial_exposure_estimate": {"low": 0, "high": 0, "currency": "ZAR", "description": "No quantifiable exposure identified"} }
6. Be conservative: Err on the side of caution. Flag anything that could reasonably be challenged.

Persona reminders:
- Consumer/tenant/employee perspective (protect the weaker party).
- Never give formal legal advice – outputs are for informational purposes only.
- Always include disclaimer in summary: "This is NOT legal advice. Consult a qualified attorney before acting."`;

  const userPrompt = `Now perform a complete risk audit following your system instructions exactly.

Full contract text:
---
${contractText.substring(0, 30000)}
---

Step-by-step thinking (do this internally before outputting):
1. Read the entire document carefully.
2. Classify the contract type and confirm applicable main Acts.
3. Break the document into individual clauses/sections.
4. For each clause: Check against BCEA/CPA/POPIA/RHA/LRA/NCA/common law. Ask: Is this unfair? Unlawful? Missing protection? Ambiguous? One-sided?
5. If risky: Quote exact text → assign risk score (0-100) → estimate Rand exposure (justify range) → explain why → suggest fix.
6. Aggregate: Calculate overallRiskScore (0-100) and overall_risk (LOW if score < 31, MEDIUM if 31-70, HIGH if > 70).

Output ONLY valid JSON matching this exact schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overall_risk: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          overallRiskScore: { type: Type.NUMBER },
          overall_summary: { type: Type.STRING },
          financial_exposure_estimate: {
            type: Type.OBJECT,
            properties: {
              low: { type: Type.NUMBER },
              high: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["low", "high", "description"]
          },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                clause_quote: { type: Type.STRING },
                risk_level: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                riskScore: { type: Type.NUMBER },
                financial_exposure: {
                  type: Type.OBJECT,
                  properties: {
                    low: { type: Type.NUMBER, nullable: true },
                    high: { type: Type.NUMBER, nullable: true },
                    description: { type: Type.STRING }
                  },
                  required: ["description"]
                },
                why_risky: { type: Type.STRING },
                what_to_do: { type: Type.STRING },
                act_reference: { type: Type.STRING }
              },
              required: ["clause_quote", "risk_level", "riskScore", "why_risky", "what_to_do", "act_reference"]
            }
          }
        },
        required: ["overall_risk", "overallRiskScore", "overall_summary", "financial_exposure_estimate", "risks"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI model.");

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch (e) {
    throw new Error("Failed to interpret the AI's analysis. Please try again.");
  }
}
