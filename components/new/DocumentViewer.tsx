import React, { useRef } from 'react';
import { FileText, Info } from 'lucide-react';
import { FlaggedClause } from '../../types';

interface DocumentViewerProps {
  text: string;
  clauses: FlaggedClause[];
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
  onScrollTo: (idx: number) => void;
}

const riskColors = {
  HIGH: 'bg-risk-high/20 border-risk-high/40 text-risk-high',
  MEDIUM: 'bg-risk-medium/20 border-risk-medium/40 text-risk-medium',
  LOW: 'bg-risk-low/20 border-risk-low/40 text-risk-low',
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({ text, clauses, hoveredIndex, onHover, onScrollTo }) => {
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
          newContent.push(
            <mark
              key={`${idx}-${i}`}
              onMouseEnter={() => onHover(idx)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onScrollTo(idx)}
              className={`px-0.5 rounded-sm cursor-pointer transition-all border-b-2 font-medium ${
                riskColors[clause.risk_level]
              } ${hoveredIndex === idx ? 'ring-1 ring-lime shadow-sm' : ''}`}
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
    <div className="bg-surface rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col h-[600px] sticky top-24">
      <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-lime rounded-lg flex items-center justify-center text-cream">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-mute uppercase tracking-[0.15em] leading-none mb-0.5">Source Document</p>
            <p className="text-xs font-semibold text-ink">Interactive Preview</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
          <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
          <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 md:p-8 font-sans text-sm leading-relaxed text-sub scrollbar-thin">
        <div className="whitespace-pre-wrap relative max-w-none">
          {content}
        </div>
      </div>
      <div className="px-6 py-3 border-t border-white/[0.04] text-center shrink-0">
        <p className="text-[8px] font-bold text-mute uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Info className="w-2.5 h-2.5" />
          Click highlighted text to jump to analysis
        </p>
      </div>
    </div>
  );
};

export default DocumentViewer;