import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Language, RiskThresholds, ExportOptions, SavedAnalysis } from './types';
import { TRANSLATIONS } from './constants';
import Header from './components/new/Header';
import HeroSection from './components/new/HeroSection';
import LoadingState from './components/new/LoadingState';
import ResultsDashboard from './components/new/ResultsDashboard';
import OnboardingModal from './components/new/OnboardingModal';
import VaultModal from './components/new/VaultModal';
import SettingsModal from './components/new/SettingsModal';
import CompareModal from './components/new/CompareModal';
import ExportModal from './components/new/ExportModal';
import { useContractAnalysis } from './hooks/useContractAnalysis';
import { useSavedAnalyses, useVault } from './hooks/useVault';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [privateNotes, setPrivateNotes] = useState<Record<number, string>>({});
  const [thresholds, setThresholds] = useState<RiskThresholds>({ lowMax: 30, mediumMax: 70 });
  const [exportConfig, setExportConfig] = useState<ExportOptions>({
    mode: 'summary', includeClauses: true, includeContext: false,
    includeScores: true, includeNotes: true, includeRecommendations: true
  });

  const analysis = useContractAnalysis();
  const { savedAnalyses, setSavedAnalyses, saveToVault } = useSavedAnalyses();
  const { showVault, setShowVault, deleteFromVault, loadFromVault } = useVault(savedAnalyses, setSavedAnalyses);

  useEffect(() => {
    const hasSeen = localStorage.getItem('contractcheck_onboarding_seen');
    if (!hasSeen) setShowOnboarding(true);
  }, []);

  const toggleSelection = useCallback((idx: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length < 2) return [...prev, idx];
      return [prev[1], idx];
    });
  }, []);

  const handleScrollTo = useCallback((idx: number) => {
    setActiveHighlight(idx);
    setTimeout(() => setActiveHighlight(null), 3000);
  }, []);

  const handleNoteChange = useCallback((idx: number, note: string) => {
    setPrivateNotes(p => ({ ...p, [idx]: note }));
  }, []);

  const handleVaultLoad = useCallback(async (item: SavedAnalysis) => {
    await loadFromVault(item, (decrypted) => {
      analysis.setAnalysis(decrypted.analysis);
      analysis.setRawText(decrypted.rawText);
      setPrivateNotes(decrypted.privateNotes || {});
    });
  }, [loadFromVault, analysis]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    analysis.setIsDragging(true);
  }, [analysis]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.relatedTarget === null) analysis.setIsDragging(false);
  }, [analysis]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    analysis.handleFileUpload(e);
  }, [analysis]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    analysis.handleFileUpload(e);
  }, [analysis]);

  // Export
  const executeExport = useCallback(() => {
    if (!analysis.analysis) return;
    const adj = adjustedAnalysis;
    if (!adj) return;

    let report = `CONTRACTCHEQ SA - ANALYSIS REPORT\nGenerated: ${new Date().toLocaleString()}\n\n`;

    if (exportConfig.mode === 'full-annotated') {
      report += `--- ANNOTATED DOCUMENT ---\n`;
      let annotated = analysis.rawText;
      adj.risks.forEach((c, i) => {
        annotated = annotated.replace(c.clause_quote, `[ISSUE #${i+1}: ${c.act_reference.toUpperCase()}] ${c.clause_quote}`);
      });
      report += annotated + '\n\n';
    }

    report += `--- RISK BREAKDOWN ---\n`;
    report += `Overall Risk: ${adj.overall_risk} (Score: ${adj.overallRiskScore})\n`;
    report += `Summary: ${adj.overall_summary}\n\n`;

    adj.risks.forEach((c, i) => {
      report += `[ISSUE #${i+1}] ${c.act_reference}\n`;
      report += `Clause: "${c.clause_quote}"\n`;
      report += `Risk Score: ${c.riskScore}/100\n`;
      report += `Analysis: ${c.why_risky}\n`;
      if (exportConfig.includeRecommendations) report += `Recommendation: ${c.what_to_do}\n`;
      if (exportConfig.includeNotes && privateNotes[i]) report += `My Private Note: ${privateNotes[i]}\n`;
      report += '\n';
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_audit_${Date.now()}.txt`;
    a.click();
    setExportOpen(false);
  }, [analysis, exportConfig, privateNotes, thresholds]);

  const adjustedAnalysis = useMemo(() => {
    if (!analysis.analysis) return null;
    const getLevel = (score: number) => {
      if (score <= thresholds.lowMax) return 'LOW' as const;
      if (score <= thresholds.mediumMax) return 'MEDIUM' as const;
      return 'HIGH' as const;
    };
    return {
      ...analysis.analysis,
      overall_risk: getLevel(analysis.analysis.overallRiskScore),
      risks: analysis.analysis.risks.map(r => ({
        ...r, risk_level: getLevel(r.riskScore)
      }))
    };
  }, [analysis.analysis, thresholds]);

  const viewState = analysis.loading ? 'loading' : analysis.analysis ? 'results' : 'hero';

  return (
    <div className="min-h-screen bg-cream flex flex-col antialiased text-ink selection:bg-lime/30 selection:text-ink">
      {showOnboarding && (
        <OnboardingModal onClose={(ds) => {
          if (ds) localStorage.setItem('contractcheck_onboarding_seen', 'true');
          setShowOnboarding(false);
        }} />
      )}

      <Header
        lang={lang}
        onLangChange={setLang}
        onVaultOpen={() => setShowVault(true)}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      <main className="flex-1 shell pt-24 pb-16">
        <AnimatePresence mode="wait">
          {viewState === 'hero' && (
            <HeroSection
              isDragging={analysis.isDragging}
              error={analysis.error}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileSelect={handleFileSelect}
              onLoadSample={analysis.loadSample}
            />
          )}

          {viewState === 'loading' && (
            <LoadingState
              loadingText={analysis.loadingText}
              progress={analysis.progress}
              heuristicIssues={analysis.heuristicIssues}
            />
          )}

          {viewState === 'results' && analysis.analysis && (
            <ResultsDashboard
              analysis={analysis.analysis}
              rawText={analysis.rawText}
              thresholds={thresholds}
              selectedIndices={selectedIndices}
              hoveredIndex={hoveredIndex}
              activeHighlight={activeHighlight}
              privateNotes={privateNotes}
              onReset={analysis.resetAnalysis}
              onSaveToVault={() => saveToVault(analysis.analysis!, analysis.rawText, privateNotes)}
              onExportOpen={() => setExportOpen(true)}
              onToggleSelect={toggleSelection}
              onHover={setHoveredIndex}
              onScrollTo={handleScrollTo}
              onNoteChange={handleNoteChange}
              onCompareOpen={() => setCompareOpen(true)}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/[0.04] py-12 mt-auto">
        <div className="shell text-center space-y-4">
          <p className="text-[9px] text-mute leading-relaxed font-bold uppercase tracking-[0.08em] max-w-xl mx-auto">
            Disclaimer: ContractCheq provides preliminary risk triage for educational awareness. It does not constitute legal advice and should not replace consultation with a qualified legal professional.
          </p>
          <p className="text-[10px] font-bold text-mute tracking-[0.4em] uppercase">ContractCheq SA — A Loopii Product</p>
          <p className="text-[8px] font-bold text-mute/60 uppercase tracking-widest">Privacy-First • SA Law • Version 2.0</p>
        </div>
      </footer>

      <VaultModal
        show={showVault}
        savedAnalyses={savedAnalyses}
        onClose={() => setShowVault(false)}
        onLoad={handleVaultLoad}
        onDelete={deleteFromVault}
      />

      <SettingsModal
        show={settingsOpen}
        thresholds={thresholds}
        onChange={setThresholds}
        onClose={() => setSettingsOpen(false)}
      />

      <CompareModal
        show={compareOpen}
        selectedIndices={selectedIndices}
        analysis={adjustedAnalysis}
        onClose={() => setCompareOpen(false)}
      />

      <ExportModal
        show={exportOpen}
        config={exportConfig}
        onChange={setExportConfig}
        onExport={executeExport}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
};

export default App;