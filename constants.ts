
import { Language, TranslationSet, AnalysisResult } from './types';

export const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: {
    highRisk: "High Risk",
    mediumRisk: "Medium Risk",
    lowRisk: "Low Risk",
    analysis: "Analysis",
    recommendation: "Recommendation",
    noIssues: "No significant issues identified.",
    overallRisk: "Overall Risk Level",
    settings: "Settings",
    compare: "Compare Clauses",
    download: "Download Original",
    export: "Export Analysis"
  },
  af: {
    highRisk: "Hoë Risiko",
    mediumRisk: "Medium Risiko",
    lowRisk: "Lae Risiko",
    analysis: "Analise",
    recommendation: "Aanbeveling",
    noIssues: "Geen beduidende kwessies nie.",
    overallRisk: "Algehele Risikovlak",
    settings: "Instellings",
    compare: "Vergelyk Klousules",
    download: "Laai Oorspronklike Af",
    export: "Voer Analise Uit"
  },
  zu: {
    highRisk: "Ingozi Ephezulu",
    mediumRisk: "Ingozi Ephakathi",
    lowRisk: "Ingozi Ephansi",
    analysis: "Ukuhlaziya",
    recommendation: "Isincomo",
    noIssues: "Azikho izinkinga ezitholakele.",
    overallRisk: "Izinga Lonke Lengozi",
    settings: "Izilungiselelo",
    compare: "Qhathanisa Izigaba",
    download: "Landa Okokuqala",
    export: "Thumela Ukuhlaziya"
  }
};

export const JARGON_EXPLANATIONS: Record<string, string> = {
  "POPIA": "Protection of Personal Information Act (4 of 2013). South Africa's data protection law which sets conditions for the lawful processing of personal info.",
  "CPA": "Consumer Protection Act (68 of 2008). Law aimed at promoting a fair, accessible, and sustainable marketplace for SA consumers.",
  "BCEA": "Basic Conditions of Employment Act (75 of 1997). Sets out the minimum requirements for employment in South Africa including leave and hours.",
  "LRA": "Labour Relations Act (66 of 1995). Regulates the relationship between employers, employees, and unions.",
  "RHA": "Rental Housing Act (50 of 1999). Governs residential leases and established Rental Housing Tribunals to resolve disputes.",
  "Constitution": "The Constitution of the Republic of South Africa, 1996. The supreme law of the land, specifically the Bill of Rights in Section 14 (Privacy).",
  "NCA": "National Credit Act (34 of 2005). Regulates credit agreements and promotes a fair and non-discriminatory credit market."
};

export const PRE_ANALYZED_SAMPLES: Record<string, AnalysisResult> = {
  "Residential Lease": {
    overall_risk: 'HIGH',
    overallRiskScore: 85,
    overall_summary: "This lease contains several high-risk clauses that violate the Rental Housing Act and POPIA. Significant financial exposure exists due to unlawful data processing and privacy violations.",
    financial_exposure_estimate: {
      low: 50000,
      high: 250000,
      currency: "ZAR",
      description: "Potential POPIA fines and Rental Housing Tribunal damages for privacy breaches."
    },
    risks: [
      {
        clause_quote: "The Landlord may enter the premises at any time without notice to the Tenant.",
        risk_level: 'HIGH',
        riskScore: 90,
        financial_exposure: {
          low: 5000,
          high: 25000,
          description: "Potential damages awarded by Rental Housing Tribunal for breach of privacy."
        },
        why_risky: "Section 14 of the Constitution and the RHA protect tenant privacy. Notice is mandatory for non-emergency inspections.",
        what_to_do: "Amend to require at least 24 hours notice for any entry.",
        act_reference: "Rental Housing Act s 4(3)"
      },
      {
        clause_quote: "The Tenant hereby consents to the Landlord selling their identity number to credit bureaus and marketing firms.",
        risk_level: 'HIGH',
        riskScore: 95,
        financial_exposure: {
          low: 10000,
          high: 100000,
          description: "POPIA administrative fines or civil claims for unlawful data processing."
        },
        why_risky: "Under POPIA, processing of personal data must be for a specific, defined purpose. Selling IDs for marketing is likely unlawful.",
        what_to_do: "Strike this clause. Identity numbers are high-risk data types.",
        act_reference: "POPIA s 11 & s 18"
      }
    ]
  },
  "Employment Agreement": {
    overall_risk: 'MEDIUM',
    overallRiskScore: 55,
    overall_summary: "The agreement mostly complies with the BCEA, but contains an unlawful overtime clause that could lead to backpay claims.",
    financial_exposure_estimate: {
      low: 5000,
      high: 30000,
      currency: "ZAR",
      description: "Potential CCMA awards for unpaid overtime and BCEA non-compliance."
    },
    risks: [
      {
        clause_quote: "The Employee shall work 55 hours per week without additional compensation.",
        risk_level: 'HIGH',
        riskScore: 88,
        financial_exposure: {
          low: 5000,
          high: 25000,
          description: "Backpay for overtime hours worked beyond the 45-hour limit."
        },
        why_risky: "The BCEA limits ordinary working hours to 45 per week. Overtime is strictly regulated and must be compensated.",
        what_to_do: "Ensure hours align with BCEA Chapter 2 standards (45 hours max).",
        act_reference: "BCEA s 9 & s 10"
      }
    ]
  }
};
