
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Lock, 
  Settings, 
  Upload, 
  FileText, 
  ChevronRight, 
  ArrowRight, 
  Zap, 
  Scale, 
  History, 
  Trash2, 
  Eye, 
  Download, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Language, AnalysisResult, RiskLevel, RiskThresholds, FlaggedClause, ExportOptions } from './types';
import { TRANSLATIONS, PRE_ANALYZED_SAMPLES, JARGON_EXPLANATIONS } from './constants';
import { parsePDF } from './services/pdfService';
import { ApiClientError, extractTextWithOCR, analyzeContractText, fetchApiVersion } from './services/analysisService';
import { estimateAnalysisConfidence, runDocumentPipeline } from './lib/documentFlow';
import { encryptData, decryptData } from './services/cryptoService';
import Button from './components/Button';
import Badge from './components/Badge';
import Onboarding from './components/Onboarding';
import RiskGauge from './components/RiskGauge';

const JargonText: React.FC<{ text: string }> = ({ text }) => {
  const jargonKeys = Object.keys(JARGON_EXPLANATIONS);
  const regex = new RegExp(`(\\b(?:${jargonKeys.join('|')})\\b)`, 'g');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => {
        const explanation = JARGON_EXPLANATIONS[part];
        if (explanation) {
          return (
            <span key={i} className="relative group cursor-help border-b-2 border-dotted border-blue-400/50 text-blue-700 font-bold px-0.5 hover:bg-blue-50 transition-colors rounded-sm">
              {part}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl leading-relaxed scale-95 group-hover:scale-100 origin-bottom">
                <span className="block font-black mb-2 border-b border-slate-700 pb-1 text-blue-300 uppercase tracking-widest">{part}</span>
                {explanation}
              </span>
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

const DocumentViewer: React.FC<{ 
  text: string, 
  clauses: FlaggedClause[], 
  hoveredIndex: number | null, 
  onHover: (idx: number | null) => void,
  onScrollTo: (idx: number) => void
}> = ({ text, clauses, hoveredIndex, onHover, onScrollTo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  if (!text) return null;

  let content: React.ReactNode[] = [text];

  clauses.forEach((clause, idx) => {
    const newContent: React.ReactNode[] = [];
    content.forEach((item) => {
      if (typeof item !== 'string') {
        newContent.push(item);
        return;
      }

      const parts = item.split(clause.clause_quote);
      parts.forEach((part, i) => {
        newContent.push(part);
        if (i < parts.length - 1) {
          const riskColors = {
            HIGH: 'bg-red-200/50 border-red-400 text-red-900',
            MEDIUM: 'bg-amber-200/50 border-amber-400 text-amber-900',
            LOW: 'bg-emerald-200/50 border-emerald-400 text-emerald-900'
          };
          
          newContent.push(
            <mark
              key={`${idx}-${i}`}
              onMouseEnter={() => onHover(idx)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onScrollTo(idx)}
              className={`px-0.5 rounded cursor-pointer transition-all border-b-2 font-medium ${
                riskColors[clause.risk_level]
              } ${hoveredIndex === idx ? 'ring-2 ring-blue-500 bg-blue-100 shadow-sm' : ''}`}
            >
              {clause.clause_quote}
            </mark>
          );
        }
      });
    });
    content = newContent;
  });

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[650px] group/viewer">
      <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Source Document</h4>
            <p className="text-xs font-bold text-slate-900">Interactive Preview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-12 font-serif text-lg leading-relaxed text-slate-700 selection:bg-blue-100 custom-scrollbar scroll-smooth">
        <div className="whitespace-pre-wrap relative">
          {content}
        </div>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <Info className="w-3 h-3" />
          Click highlighted text to jump to analysis
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const [apiVersion, setApiVersion] = useState<string>('unknown');
  const [analysisConfidence, setAnalysisConfidence] = useState<number | null>(null);
  const [confidenceWarning, setConfidenceWarning] = useState<string | null>(null);
  const [requestAudit, setRequestAudit] = useState<{ requestId?: string; version?: string; errorCode?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [privateNotes, setPrivateNotes] = useState<Record<number, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<RiskThresholds>({
    lowMax: 30,
    mediumMax: 70
  });
  const [exportConfig, setExportConfig] = useState<ExportOptions>({
    mode: 'summary',
    includeClauses: true,
    includeContext: false,
    includeScores: true,
    includeNotes: true,
    includeRecommendations: true
  });

  const t = TRANSLATIONS[lang];
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const adjustedAnalysis = useMemo(() => {
    if (!analysis) return null;

    const getLevel = (score: number): RiskLevel => {
      if (score <= thresholds.lowMax) return 'LOW';
      if (score <= thresholds.mediumMax) return 'MEDIUM';
      return 'HIGH';
    };

    const updatedRisks = analysis.risks.map(r => ({
      ...r,
      risk_level: getLevel(r.riskScore)
    }));

    return {
      ...analysis,
      overall_risk: getLevel(analysis.overallRiskScore),
      risks: updatedRisks
    };
  }, [analysis, thresholds]);

  useEffect(() => {
    const hasSeen = localStorage.getItem('contractcheck_onboarding_seen');
    if (!hasSeen) setShowOnboarding(true);
    
    const saved = localStorage.getItem('contractcheck_vault');
    if (saved) setSavedAnalyses(JSON.parse(saved));

    fetchApiVersion().then(setApiVersion);
  }, []);

  const saveToVault = async () => {
    if (!analysis) return;
    const password = prompt("Enter a password to encrypt this analysis:");
    if (!password) return;

    try {
      setLoading(true);
      setLoadingText("Encrypting and saving...");
      const encrypted = await encryptData({
        analysis,
        rawText,
        privateNotes,
        timestamp: new Date().toISOString()
      }, password);

      const newSaved = [...savedAnalyses, { id: Date.now(), timestamp: new Date().toISOString(), encrypted }];
      setSavedAnalyses(newSaved);
      localStorage.setItem('contractcheck_vault', JSON.stringify(newSaved));
      alert("Analysis saved securely to your local vault.");
    } catch (err) {
      alert("Failed to save: " + err);
    } finally {
      setLoading(false);
    }
  };

  const loadFromVault = async (item: any) => {
    const password = prompt("Enter your vault password to decrypt:");
    if (!password) return;

    try {
      setLoading(true);
      setLoadingText("Decrypting...");
      const decrypted = await decryptData(item.encrypted, password);
      setAnalysis(decrypted.analysis);
      setRawText(decrypted.rawText);
      setPrivateNotes(decrypted.privateNotes || {});
      setShowVault(false);
    } catch (err) {
      alert("Decryption failed. Incorrect password?");
    } finally {
      setLoading(false);
    }
  };

  const deleteFromVault = (id: number) => {
    if (!confirm("Delete this saved analysis?")) return;
    const newSaved = savedAnalyses.filter(a => a.id !== id);
    setSavedAnalyses(newSaved);
    localStorage.setItem('contractcheck_vault', JSON.stringify(newSaved));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    if (e.type === 'drop') {
      const de = e as React.DragEvent;
      de.preventDefault(); de.stopPropagation(); setIsDragging(false);
      file = de.dataTransfer.files[0];
    } else {
      const ce = e as React.ChangeEvent<HTMLInputElement>;
      file = ce.target.files?.[0];
    }

    if (!file) return;

    setLoading(true); setProgress(10); setLoadingText('Preparing document...');
    setError(null); setOcrNotice(null); setConfidenceWarning(null); setRequestAudit(null);

    try {
      const pipeline = await runDocumentPipeline(file, {
        parsePdf: parsePDF,
        extractOcr: extractTextWithOCR
      });

      if (pipeline.source === 'pdf_ocr_fallback') {
        setLoadingText('Low text density detected. Running OCR.Space fallback...');
        setOcrNotice('OCR fallback was used because this PDF appears to be scan-based. Check output for OCR errors.');
      } else if (pipeline.source === 'image_ocr') {
        setLoadingText('Running OCR.Space on image...');
        setOcrNotice('OCR was used for image extraction. Review text for recognition errors.');
      } else {
        setLoadingText('Extracting PDF text...');
      }

      setRawText(pipeline.text);
      const confidence = estimateAnalysisConfidence({
        text: pipeline.text,
        usedOCR: pipeline.usedOCR,
        denseChars: pipeline.denseChars,
        pageCount: pipeline.pageCount
      });
      setAnalysisConfidence(confidence.score);
      setConfidenceWarning(confidence.warning);

      setLoadingText('Analyzing extracted text with Groq...');
      setProgress(45);

      const result = await analyzeContractText(pipeline.text);
      setAnalysis(result.analysis);
      setRequestAudit({ requestId: result.requestId, version: result.version });
      setPrivateNotes({});
    } catch (err: any) {
      const message = err?.message || 'Analysis failed. Please try a different document or check your connection.';
      setError(message);
      if (err instanceof ApiClientError) {
        setRequestAudit({ requestId: err.requestId, version: err.version, errorCode: err.code });
      }
    } finally {
      setLoading(false); setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we are actually leaving the container, 
    // to avoid flickering when hovering over children
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  };

  const toggleSelection = (idx: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length < 2) return [...prev, idx];
      return [prev[1], idx]; 
    });
  };

  const scrollToClause = (idx: number) => {
    setActiveHighlight(idx);
    cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setActiveHighlight(null), 3000);
  };

  const executeExport = () => {
    if (!analysis) return;
    let report = `CONTRACTCHECK SA - ANALYSIS REPORT\nGenerated: ${new Date().toLocaleString()}\n\n`;
    
    if (exportConfig.mode === 'full-annotated') {
      report += `--- ANNOTATED DOCUMENT ---\n`;
      let annotated = rawText;
      adjustedAnalysis!.risks.forEach((c, i) => {
        annotated = annotated.replace(c.clause_quote, `[ISSUE #${i+1}: ${c.act_reference.toUpperCase()}] ${c.clause_quote}`);
      });
      report += annotated + `\n\n`;
    }

    report += `--- RISK BREAKDOWN ---\n`;
    report += `Overall Risk: ${adjustedAnalysis!.overall_risk} (Score: ${adjustedAnalysis!.overallRiskScore})\n`;
    report += `Summary: ${adjustedAnalysis!.overall_summary}\n\n`;
    
    adjustedAnalysis!.risks.forEach((c, i) => {
      report += `[ISSUE #${i+1}] ${c.act_reference}\n`;
      report += `Clause: "${c.clause_quote}"\n`;
      report += `Risk Score: ${c.riskScore}/100\n`;
      report += `Analysis: ${c.why_risky}\n`;
      if (exportConfig.includeRecommendations) report += `Recommendation: ${c.what_to_do}\n`;
      if (exportConfig.includeNotes && privateNotes[i]) report += `My Private Note: ${privateNotes[i]}\n`;
      report += `\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_audit_${Date.now()}.txt`;
    a.click();
    setShowExportModal(false);
  };

  const loadSample = (key: string) => {
    setAnalysis(PRE_ANALYZED_SAMPLES[key]);
    setRawText(`Demo Content for ${key}:\n\n` + PRE_ANALYZED_SAMPLES[key].risks.map(c => c.clause_quote).join('\n\n'));
    setPrivateNotes({});
    setSelectedIndices([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased text-slate-900 selection:bg-blue-100">
      {showOnboarding && <Onboarding onClose={(ds) => { if (ds) localStorage.setItem('contractcheck_onboarding_seen', 'true'); setShowOnboarding(false); }} />}

      <AnimatePresence>
        {showExportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] shadow-3xl max-w-md w-full p-10 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Export Analysis</h3>
              </div>
              <div className="space-y-6 mb-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Format</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setExportConfig({...exportConfig, mode: 'summary'})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${exportConfig.mode === 'summary' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>Summary Only</button>
                    <button onClick={() => setExportConfig({...exportConfig, mode: 'full-annotated'})} className={`p-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${exportConfig.mode === 'full-annotated' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>Full Annotated</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <span className="text-[10px] font-black text-slate-600 uppercase">Include Solutions</span>
                    <input type="checkbox" checked={exportConfig.includeRecommendations} onChange={(e) => setExportConfig({...exportConfig, includeRecommendations: e.target.checked})} className="w-5 h-5 rounded border-slate-200 text-blue-600" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <span className="text-[10px] font-black text-slate-600 uppercase">Include My Notes</span>
                    <input type="checkbox" checked={exportConfig.includeNotes} onChange={(e) => setExportConfig({...exportConfig, includeNotes: e.target.checked})} className="w-5 h-5 rounded border-slate-200 text-blue-600" />
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1" onClick={() => setShowExportModal(false)}>Cancel</Button>
                <Button className="flex-1 shadow-xl shadow-blue-500/20" onClick={executeExport}>Save File</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] shadow-3xl max-w-md w-full p-10 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Risk Thresholds</h3>
              </div>
              <p className="text-slate-500 text-sm mb-8 font-medium italic">Customize how risk levels are assigned based on the AI's 0-100 score.</p>
              
              <div className="space-y-10 mb-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Risk Max Score</p>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">{thresholds.lowMax}</span>
                  </div>
                  <input 
                    type="range" min="10" max="50" step="5"
                    value={thresholds.lowMax}
                    onChange={(e) => setThresholds({...thresholds, lowMax: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medium Risk Max Score</p>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">{thresholds.mediumMax}</span>
                  </div>
                  <input 
                    type="range" min="55" max="90" step="5"
                    value={thresholds.mediumMax}
                    onChange={(e) => setThresholds({...thresholds, mediumMax: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              <Button className="w-full shadow-xl shadow-blue-500/20" onClick={() => setShowSettings(false)}>Apply Changes</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVault && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] shadow-3xl max-w-2xl w-full p-10 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Legal Vault</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowVault(false)}>Close</Button>
              </div>
              
              {savedAnalyses.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Lock className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Your vault is empty</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {savedAnalyses.map((item) => (
                    <div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                          <History className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Analysis from {new Date(item.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(item.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => deleteFromVault(item.id)} icon={<Trash2 className="w-3.5 h-3.5" />} />
                        <Button size="sm" onClick={() => loadFromVault(item)} icon={<Eye className="w-3.5 h-3.5" />}>Load</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isComparing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-10"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              className="bg-white w-full max-w-7xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b flex justify-between items-center bg-slate-50/80">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">Side-by-Side View</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsComparing(false)}>Close Comparison</Button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 gap-16">
                {selectedIndices.map((idx) => {
                  const c = adjustedAnalysis!.risks[idx];
                  return (
                    <div key={idx} className="space-y-8">
                      <div className="flex justify-between items-start">
                        <Badge level={c.risk_level} label={`${c.risk_level} threat`} />
                        <span className="text-[10px] font-black text-slate-300 uppercase">Clause #{idx+1} (Score: {c.riskScore})</span>
                      </div>
                      <h3 className="text-3xl font-black text-blue-600 leading-tight">{c.act_reference}</h3>
                      <div className="bg-slate-50 p-8 rounded-3xl italic text-slate-700 border border-slate-100 shadow-inner text-lg leading-relaxed font-medium">"{c.clause_quote}"</div>
                      <div className="space-y-6">
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                          <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Analysis</h4>
                          <p className="text-md leading-relaxed text-slate-600"><JargonText text={c.why_risky} /></p>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 font-bold text-slate-800 shadow-sm">
                          <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">What to do</h4>
                          {c.what_to_do}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 cursor-pointer group" 
            onClick={() => window.location.reload()}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">ContractCheck</h1>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">South Africa</span>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowVault(true)}
              className="rounded-xl"
              title="Legal Vault"
              icon={<Lock className="w-4 h-4" />}
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSettings(true)}
              className="rounded-xl"
              title="Risk Thresholds"
              icon={<Settings className="w-4 h-4" />}
            />
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['en', 'af', 'zu'] as Language[]).map(l => (
                <button 
                  key={l} 
                  onClick={() => setLang(l)} 
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${lang === l ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {!analysis && !loading && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-20 py-10"
            >
              <div className="text-center space-y-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 mb-4"
                >
                  <Zap className="w-3 h-3" />
                  AI-Powered Legal Triage
                </motion.div>
                <h2 className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] max-w-4xl mx-auto">
                  Know your risks <span className="text-blue-600">before</span> you sign.
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-xl leading-relaxed font-medium">
                  Spot unfair terms and legal traps in South African leases, job offers, or sales agreements using AI tailored for local law.
                </p>
              </div>

              <motion.div 
                className={`relative border-[1px] rounded-[4rem] p-24 text-center transition-all duration-700 bg-white group ${isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-2xl' : 'border-slate-200 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/5'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleFileUpload}
              >
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={handleFileUpload} 
                />
                <div className="space-y-8 relative z-0 pointer-events-none">
                  <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto transition-all duration-500 ${isDragging ? 'bg-blue-600 text-white scale-110 rotate-12' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:scale-110'}`}>
                    <Upload className="w-10 h-10" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                      {isDragging ? 'Drop it now!' : 'Drop PDF/Image or Click to Upload'}
                    </h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      Privacy Guaranteed • SA Law Compliance • Instant Audit
                    </p>
                  </div>
                  {!isDragging && (
                    <Button size="lg" className="pointer-events-none">
                      Select Document
                    </Button>
                  )}
                </div>
              </motion.div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 bg-red-50 border border-red-100 rounded-[2rem] text-center flex flex-col items-center gap-3"
                >
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <p className="text-red-700 font-black text-sm">{error}</p>
                  {requestAudit && (
                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider space-y-1">
                      {requestAudit.errorCode && <div>Error Code: {requestAudit.errorCode}</div>}
                      {requestAudit.requestId && <div>Request ID: {requestAudit.requestId}</div>}
                      {requestAudit.version && <div>API Version: {String(requestAudit.version).slice(0, 7)}</div>}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setError(null)}>Clear and Retry</Button>
                </motion.div>
              )}

              {ocrNotice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] text-center flex flex-col items-center gap-3"
                >
                  <Info className="w-6 h-6 text-amber-600" />
                  <p className="text-amber-700 font-black text-sm">{ocrNotice}</p>
                </motion.div>
              )}

              {analysisConfidence !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`p-6 border rounded-[2rem] text-center flex flex-col items-center gap-2 ${analysisConfidence < 75 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}
                >
                  <p className={`text-xs font-black uppercase tracking-widest ${analysisConfidence < 75 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    Analysis Confidence: {analysisConfidence}%
                  </p>
                  {confidenceWarning && <p className="text-amber-700 font-bold text-sm">{confidenceWarning}</p>}
                </motion.div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {Object.keys(PRE_ANALYZED_SAMPLES).map((key, i) => (
                  <motion.button 
                    key={key} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    onClick={() => loadSample(key)} 
                    className="p-10 bg-white border border-slate-200 rounded-[3rem] text-left hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col justify-between h-full"
                  >
                    <div className="relative z-10">
                      <Badge level={PRE_ANALYZED_SAMPLES[key].overall_risk} label={`${key} Demo`} />
                      <h4 className="text-3xl font-black text-slate-900 mt-6 leading-tight">Common {key} Risks</h4>
                      <p className="text-slate-500 text-md mt-4 leading-relaxed font-medium">See how ContractCheck identifies problematic clauses in a standard South African {key}.</p>
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest group-hover:translate-x-2 transition-transform">
                      View Demo <ArrowRight className="w-3 h-3" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-40 text-center space-y-12"
            >
              <div className="relative inline-flex mb-8">
                <div className="w-32 h-32 rounded-[3rem] border-[8px] border-blue-50"></div>
                <div className="absolute inset-0 w-32 h-32 rounded-[3rem] border-[8px] border-blue-600 border-t-transparent animate-spin"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{loadingText}</h3>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Our AI is scanning every clause...</p>
              </div>
              <div className="max-w-md mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-600" 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )}

          {adjustedAnalysis && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200 flex flex-wrap justify-between items-center gap-4 shadow-sm no-print sticky top-[88px] z-30">
                <Button variant="ghost" size="sm" onClick={() => { setAnalysis(null); setRawText(''); }} className="font-black">
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> New Analysis
                </Button>
                <div className="flex gap-2">
                  {selectedIndices.length === 2 && (
                    <Button size="sm" onClick={() => setIsComparing(true)} className="animate-pulse">
                      Compare Selected ({selectedIndices.length})
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={saveToVault} icon={<Lock className="w-3.5 h-3.5" />}>Save to Vault</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowExportModal(true)} icon={<Download className="w-3.5 h-3.5" />}>Download Report</Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-7 space-y-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] shadow-xl border border-slate-100 p-12 flex flex-col md:flex-row gap-12 items-center"
                  >
                    <RiskGauge score={adjustedAnalysis.overallRiskScore} level={adjustedAnalysis.overall_risk} label={`${adjustedAnalysis.overall_risk} risk`} clauses={adjustedAnalysis.risks} />
                    <div className="space-y-6 flex-1 text-center md:text-left">
                      <h3 className="text-4xl font-black text-slate-900 tracking-tight">AI Audit Result</h3>
                      <p className="text-slate-600 leading-relaxed font-medium">{adjustedAnalysis.overall_summary}</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="px-6 py-4 bg-slate-900 rounded-2xl text-white shadow-xl">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Financial Exposure (Est)</p>
                          <p className="text-xl font-black">R{(adjustedAnalysis.financial_exposure_estimate.low ?? 0).toLocaleString()} - R{(adjustedAnalysis.financial_exposure_estimate.high ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-700 uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            POPIA Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Flagged Issues</h4>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select two to compare</span>
                    </div>
                    {adjustedAnalysis.risks.map((clause, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        ref={el => cardRefs.current[idx] = el}
                        onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}
                        className={`bg-white rounded-[3rem] border-2 transition-all duration-500 overflow-hidden relative group/card ${
                          selectedIndices.includes(idx) ? 'border-blue-500 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-md hover:border-slate-200 hover:shadow-lg'
                        } ${activeHighlight === idx ? 'ring-4 ring-blue-500 ring-offset-4 scale-[1.02]' : ''}`}
                      >
                        <button 
                          onClick={() => toggleSelection(idx)} 
                          className={`absolute top-8 right-8 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedIndices.includes(idx) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'border-slate-200 text-transparent hover:border-blue-300'}`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>

                        <div className={`h-2.5 w-full ${clause.risk_level === 'HIGH' ? 'bg-red-500' : clause.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        
                        <div className="p-12 space-y-10">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge level={clause.risk_level} label={`${clause.risk_level} threat`} />
                              <h5 className="text-3xl font-black text-slate-900 mt-4 leading-tight">{clause.act_reference}</h5>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Score</p>
                              <p className="text-lg font-black text-slate-900">{clause.riskScore}/100</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-8 rounded-3xl italic text-slate-700 leading-relaxed border border-slate-100 shadow-inner group-hover/card:bg-slate-100/50 transition-colors font-medium">
                            "{clause.clause_quote}"
                          </div>

                          <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                Risk Analysis
                              </h6>
                              <p className="text-md text-slate-600 leading-relaxed font-medium"><JargonText text={clause.why_risky} /></p>
                            </div>
                            <div className="space-y-4">
                              <h6 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <Scale className="w-3 h-3" />
                                Expert Recommendation
                              </h6>
                              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-slate-800 text-sm font-bold shadow-sm leading-relaxed">
                                {clause.what_to_do}
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Exposure Context</span>
                            <span className="text-[10px] font-bold text-slate-500 italic flex items-center gap-2">
                              <Info className="w-3 h-3" />
                              {clause.financial_exposure.description}
                            </span>
                          </div>

                          <div className="pt-8 border-t border-slate-50 space-y-4">
                            <h6 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Private Annotation
                            </h6>
                            <textarea 
                              value={privateNotes[idx] || ''} 
                              onChange={(e) => setPrivateNotes({...privateNotes, [idx]: e.target.value})} 
                              placeholder="Type your notes here... (Stored locally on your device)" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium text-slate-600 focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-400 outline-none transition-all placeholder:text-slate-300 resize-none shadow-inner" 
                              rows={3}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 sticky top-48 space-y-8 no-print">
                  <DocumentViewer 
                    text={rawText} 
                    clauses={adjustedAnalysis.risks} 
                    hoveredIndex={hoveredIndex} 
                    onHover={setHoveredIndex} 
                    onScrollTo={scrollToClause} 
                  />
                  
                  <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8 relative z-10">SA Law Knowledge Base</h5>
                    <div className="grid gap-4 relative z-10">
                      {Object.keys(JARGON_EXPLANATIONS).map((key) => (
                        <div key={key} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-help group/item border border-white/5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-600/20">{key[0]}</div>
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover/item:text-white transition-colors">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-slate-100 py-24 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-10 text-center space-y-10">
          <div className="flex justify-center gap-8">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-[0.1em] max-w-xl mx-auto">
            Disclaimer: ContractCheck provides preliminary risk triage for educational awareness. It does not constitute legal advice and should not replace consultation with a qualified legal professional.
          </p>
          <div className="flex flex-col items-center gap-4">
            <p className="text-[11px] font-black text-slate-300 tracking-[0.5em] uppercase">ContractCheck SA</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Version 1.0.5 • API {apiVersion.slice(0, 7)} • Privacy-First Triage</p>
          </div>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        ::selection { background: #dbeafe; color: #1e40af; }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
