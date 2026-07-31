import { useState, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { AnalysisResult, HeuristicIssue } from '../types';
import { PRE_ANALYZED_SAMPLES } from '../constants';
import { parsePDF } from '../services/pdfService';
import { analyzeContract, classifyAndOCR } from '../services/geminiService';
import { compressImage } from '../services/imageService';
import { generateHash, getCachedAnalysis, cacheAnalysis } from '../services/cacheService';
import { runHeuristics } from '../services/heuristicsService';

export interface AnalysisState {
  analysis: AnalysisResult | null;
  rawText: string;
  loading: boolean;
  loadingText: string;
  progress: number;
  error: string | null;
  heuristicIssues: HeuristicIssue[];
  isDragging: boolean;
}

export function useContractAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    analysis: null,
    rawText: '',
    loading: false,
    loadingText: '',
    progress: 0,
    error: null,
    heuristicIssues: [],
    isDragging: false,
  });

  const update = (partial: Partial<AnalysisState>) =>
    setState(s => ({ ...s, ...partial }));

  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement> | DragEvent) => {
    let file: File | undefined;
    if (e.type === 'drop') {
      const de = e as DragEvent;
      de.preventDefault(); de.stopPropagation();
      update({ isDragging: false });
      file = de.dataTransfer.files[0];
    } else {
      const ce = e as ChangeEvent<HTMLInputElement>;
      file = ce.target.files?.[0];
    }

    if (!file) return;

    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isImage) {
      update({ error: 'Please upload a valid PDF or image (JPEG, PNG, WebP).', isDragging: false });
      return;
    }

    update({
      loading: true,
      progress: 10,
      loadingText: isPDF ? 'Extracting text...' : 'Optimizing image...',
      error: null,
      heuristicIssues: [],
    });

    try {
      let text = '';
      let analysisInput: { text?: string; image?: { data: string; mimeType: string } } = {};
      let contentForHash = '';

      if (isPDF) {
        text = await parsePDF(file);
        update({ rawText: text });
        analysisInput = { text };
        contentForHash = text;
      } else {
        const compressed = await compressImage(file);
        analysisInput = { image: compressed };
        update({ rawText: '[Image Analysis — Text transcription in progress...]' });
        contentForHash = compressed.data;
      }

      // Check Cache
      const hash = await generateHash(contentForHash);
      const cached = await getCachedAnalysis(hash);

      if (cached) {
        update({ loadingText: 'Restoring from vault...', progress: 90 });
        setTimeout(() => {
          update({
            analysis: cached,
            rawText: cached.extracted_text || state.rawText,
            loading: false,
            progress: 0,
          });
        }, 500);
        return;
      }

      // Run Heuristics
      let extractedText = isPDF ? contentForHash : '';
      let docType = '';

      if (!isPDF) {
        update({ loadingText: 'Performing OCR & Classification...', progress: 30 });
        const ocr = await classifyAndOCR(analysisInput);
        extractedText = ocr.text;
        docType = ocr.type;
        update({ rawText: extractedText });
      }

      if (extractedText) {
        const issues = runHeuristics(extractedText);
        update({ heuristicIssues: issues });
      }

      update({ loadingText: 'Scanning for SA legal traps...', progress: 60 });
      const result = await analyzeContract(analysisInput, extractedText, docType);

      await cacheAnalysis(hash, result);
      update({ analysis: result });
    } catch (err: any) {
      update({ error: err.message || 'Analysis failed. Please try a different document or check your connection.' });
    } finally {
      update({ loading: false, progress: 0 });
    }
  }, [state.rawText]);

  const loadSample = useCallback((key: string) => {
    const sample = PRE_ANALYZED_SAMPLES[key];
    if (!sample) return;
    update({
      analysis: sample,
      rawText: `Demo Content for ${key}:\n\n` + sample.risks.map(c => c.clause_quote).join('\n\n'),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetAnalysis = useCallback(() => {
    update({ analysis: null, rawText: '', error: null, heuristicIssues: [] });
  }, []);

  return {
    ...state,
    update,
    handleFileUpload,
    loadSample,
    resetAnalysis,
  };
}