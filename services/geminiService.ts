
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FlaggedClause } from "../types";

export interface AnalysisInput {
  text?: string;
  image?: {
    data: string;
    mimeType: string;
  };
}

/**
 * Hybrid Routing: Use Flash for classification and OCR (Faster/Cheaper)
 */
export async function classifyAndOCR(input: AnalysisInput): Promise<{ type: string; text: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = "Classify this document type (e.g. Lease, Employment, NDA) and extract all text accurately. If it's an image, perform high-quality OCR. Return JSON with 'type' and 'text'.";
  
  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (input.image) {
    contents.parts.push({
      inlineData: {
        data: input.image.data,
        mimeType: input.image.mimeType
      }
    });
  } else if (input.text) {
    contents.parts.push({ text: input.text });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          text: { type: Type.STRING }
        },
        required: ["type", "text"]
      }
    }
  });

  return JSON.parse(response.text || '{"type":"Unknown","text":""}');
}

/**
 * Token-Aware Chunking: Split text into chunks of ~15k chars
 */
export function chunkText(text: string, size = 15000): string[] {
  const chunks: string[] = [];
  let current = 0;
  while (current < text.length) {
    // Try to break at a newline or period if possible
    let end = current + size;
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      if (lastNewline > current + size * 0.5) {
        end = lastNewline;
      }
    }
    chunks.push(text.substring(current, end));
    current = end;
  }
  return chunks;
}

export async function analyzeContract(input: AnalysisInput, preExtractedText?: string, preExtractedType?: string): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Classification & OCR (Using Flash - Faster/Cheaper)
  let docType = preExtractedType;
  let fullText = preExtractedText;

  if (!fullText || !docType) {
    const ocrResult = await classifyAndOCR(input);
    docType = docType || ocrResult.type;
    fullText = fullText || ocrResult.text;
  }

  if (fullText) {
    const injectionPatterns = /ignore (previous|all) instructions|system prompt|<\|im_start\|>|<\|im_end\|>/i;
    if (injectionPatterns.test(fullText)) {
      throw new Error('Potential security risk detected. We cannot process this document.');
    }
  }

  // 2. Chunking for long documents
  const chunks = chunkText(fullText);
  
  const systemPrompt = `You are a senior South African attorney with 20+ years of experience in consumer, employment, rental housing, and data protection law. You ONLY analyse contracts under current South African statutes and case law as of March 2026. You NEVER hallucinate clauses, cases, or interpretations that do not exist. If something is unclear, ambiguous, or outside your knowledge, state "INSUFFICIENT EVIDENCE – REQUIRES HUMAN REVIEW" instead of guessing.

Your task is to perform a complete risk audit on the provided contract text. Follow these strict rules:

1. Identify EVERY potentially unfair, unlawful, risky, missing, or ambiguous clause.
2. Reference ONLY real, current SA law: 
   - Basic Conditions of Employment Act (BCEA) 1997
   - Consumer Protection Act (CPA) 2008
   - Protection of Personal Information Act (POPIA) 2013
   - Rental Housing Act (RHA) 1999
   - Labour Relations Act (LRA) 1995
   - National Credit Act (NCA) 2005
   - Common law principles (good faith, ubuntu, public policy)
3. For EVERY flagged item:
   - Quote the EXACT clause text.
   - Assign a numerical riskScore (0-100).
   - Assign risk level: LOW / MEDIUM / HIGH.
   - Calculate realistic Rand financial exposure range (low-high).
   - Explain "WHY IT'S RISKY" in plain, concise English.
   - Provide "WHAT TO DO" practical fix or negotiation language.
   - Link to the specific Act/section.
4. DOCUMENT CLASSIFICATION & FEATURE DETECTION:
   - The document has been classified as: ${docType}.
   - Detect if signatures are present on the document.
   - Detect if official stamps (e.g., Commissioner of Oaths) are present.
   - Detect if there is any handwriting (notes, strike-throughs, amendments).
5. Output ONLY in structured JSON format.
6. If no risks found: return empty risks array and appropriate summary.

Persona reminders:
- Consumer/tenant/employee perspective (protect the weaker party).
- Never give formal legal advice.
- Always include disclaimer in summary: "This is NOT legal advice. Consult a qualified attorney before acting."`;

  const userPrompt = `Perform a complete risk audit following your system instructions. 
Look specifically for handwritten amendments as they often contain critical changes.
Output ONLY valid JSON matching the schema.`;

  // 3. Analyze chunks (Using Pro for deep reasoning)
  const results: AnalysisResult[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          { text: userPrompt },
          { text: `Contract Chunk ${i+1}/${chunks.length}:\n---\n${chunks[i]}\n---` }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overall_risk: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            overallRiskScore: { type: Type.NUMBER },
            overall_summary: { type: Type.STRING },
            document_type: { type: Type.STRING },
            signatures_detected: { type: Type.BOOLEAN },
            stamps_detected: { type: Type.BOOLEAN },
            handwriting_detected: { type: Type.BOOLEAN },
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
          required: ["overall_risk", "overallRiskScore", "overall_summary", "financial_exposure_estimate", "risks", "document_type", "signatures_detected", "stamps_detected", "handwriting_detected"]
        }
      }
    });

    const text = response.text;
    if (text) {
      results.push(JSON.parse(text));
    }
  }

  if (results.length === 0) throw new Error("No response from AI model.");

  // 4. Merge results
  const finalResult: AnalysisResult = {
    overall_risk: "LOW",
    overallRiskScore: 0,
    overall_summary: "",
    document_type: docType,
    signatures_detected: false,
    stamps_detected: false,
    handwriting_detected: false,
    financial_exposure_estimate: { low: 0, high: 0, description: "" },
    risks: []
  };
  
  const riskLevels = ["LOW", "MEDIUM", "HIGH"];
  
  for (const res of results) {
    finalResult.risks.push(...res.risks);
    
    // Take highest risk level
    if (riskLevels.indexOf(res.overall_risk) > riskLevels.indexOf(finalResult.overall_risk)) {
      finalResult.overall_risk = res.overall_risk;
    }
    
    // Take max risk score
    finalResult.overallRiskScore = Math.max(finalResult.overallRiskScore, res.overallRiskScore);
    
    // OR detected features
    finalResult.signatures_detected = finalResult.signatures_detected || res.signatures_detected || false;
    finalResult.stamps_detected = finalResult.stamps_detected || res.stamps_detected || false;
    finalResult.handwriting_detected = finalResult.handwriting_detected || res.handwriting_detected || false;
    
    // Sum financial exposure
    finalResult.financial_exposure_estimate.low += res.financial_exposure_estimate.low;
    finalResult.financial_exposure_estimate.high += res.financial_exposure_estimate.high;
    
    if (res.overall_summary) {
      if (finalResult.overall_summary) finalResult.overall_summary += " ";
      finalResult.overall_summary += res.overall_summary;
    }
  }

  if (results.length > 1) {
    finalResult.overall_summary = `[Comprehensive Analysis of ${results.length} sections] ${finalResult.overall_summary}`;
    finalResult.financial_exposure_estimate.description = `Aggregated estimate across all document sections. ${results[0].financial_exposure_estimate.description}`;
  } else {
    finalResult.financial_exposure_estimate.description = results[0].financial_exposure_estimate.description;
  }

  finalResult.document_type = docType;
  finalResult.extracted_text = fullText;

  return finalResult;
}
