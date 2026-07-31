import React from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, ImageIcon, Camera, AlertTriangle } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import Button from './Button';

interface UploadZoneProps {
  isDragging: boolean;
  error: string | null;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  isDragging, error, onDragOver, onDragLeave, onDrop, onFileSelect
}) => (
  <div className="space-y-6">
    <motion.div
      className={`relative border-2 rounded-[2.5rem] p-12 md:p-16 text-center transition-all duration-500 bg-surface group cursor-pointer ${
        isDragging ? 'border-lime bg-lime/5 scale-[1.01] shadow-2xl shadow-lime/10' : 'border-white/[0.06] hover:border-lime/40 hover:shadow-lg'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept=".pdf,image/*"
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={onFileSelect}
      />
      <div className="space-y-6 relative z-0 pointer-events-none">
        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto transition-all duration-500 ${
          isDragging ? 'bg-lime text-cream scale-110 rotate-12' : 'bg-elevated text-mute group-hover:bg-lime/10 group-hover:text-lime group-hover:scale-110'
        }`}>
          {isDragging ? <Upload className="w-8 h-8" /> : (
            <div className="flex gap-1.5">
              <FileText className="w-5 h-5" />
              <ImageIcon className="w-5 h-5" />
              <Camera className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold text-ink">
            {isDragging ? 'Drop it now!' : 'Drop PDF/Photo or Click to Upload'}
          </h3>
          <p className="text-[10px] font-bold text-mute uppercase tracking-widest">
            Privacy Guaranteed • SA Law Compliance • Multimodal Scan
          </p>
        </div>
        {!isDragging && (
          <Button variant="primary" size="lg" className="pointer-events-none mx-auto">
            Select Document
          </Button>
        )}
      </div>
    </motion.div>

    {error && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="p-5 bg-risk-high-bg border border-risk-high/20 rounded-2xl text-center flex flex-col items-center gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-risk-high" />
        <p className="text-risk-high text-sm font-bold">{error}</p>
      </motion.div>
    )}
  </div>
);

export default UploadZone;