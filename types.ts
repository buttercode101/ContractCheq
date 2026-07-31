
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskThresholds {
  lowMax: number;
  mediumMax: number;
}

export interface FinancialExposure {
  low: number | null;
  high: number | null;
  currency?: string;
  description: string;
}

export interface FlaggedClause {
  clause_quote: string;
  risk_level: RiskLevel; 
  riskScore: number; // 0-100
  financial_exposure: FinancialExposure;
  why_risky: string;
  what_to_do: string;
  act_reference: string;
  privateNote?: string; // Local user note
}

export interface AnalysisResult {
  overall_risk: RiskLevel;
  overallRiskScore: number; // 0-100
  overall_summary: string;
  financial_exposure_estimate: FinancialExposure;
  risks: FlaggedClause[];
  extracted_text?: string;
  document_type?: string;
  signatures_detected?: boolean;
  stamps_detected?: boolean;
  handwriting_detected?: boolean;
}

export interface SavedAnalysis {
  id: number;
  timestamp: string;
  encrypted: {
    salt: number[];
    iv: number[];
    data: number[];
  };
}

export type Language = 'en' | 'af' | 'zu';

export interface TranslationSet {
  highRisk: string;
  mediumRisk: string;
  lowRisk: string;
  analysis: string;
  recommendation: string;
  noIssues: string;
  overallRisk: string;
  settings: string;
  compare: string;
  download: string;
  export: string;
}

export interface ExportOptions {
  mode: 'summary' | 'full-annotated';
  includeClauses: boolean;
  includeContext: boolean;
  includeScores: boolean;
  includeNotes: boolean;
  includeRecommendations: boolean;
}

export interface HeuristicIssue {
  clause: string;
  risk_level: RiskLevel;
  why_risky: string;
  what_to_do: string;
  act_reference: string;
}

export type ViewState = 'hero' | 'loading' | 'results';
