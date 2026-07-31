import { useState, useCallback, useEffect } from 'react';
import { SavedAnalysis } from '../types';
import { encryptData, decryptData } from '../services/cryptoService';

export function useVault(savedAnalyses: SavedAnalysis[],
                         setSavedAnalyses: (a: SavedAnalysis[]) => void) {
  const [showVault, setShowVault] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');

  const deleteFromVault = useCallback((id: number) => {
    const newSaved = savedAnalyses.filter(a => a.id !== id);
    setSavedAnalyses(newSaved);
    localStorage.setItem('contractcheck_vault', JSON.stringify(newSaved));
  }, [savedAnalyses, setSavedAnalyses]);

  const loadFromVault = useCallback(async (item: SavedAnalysis,
                                           onDecrypted: (data: any) => void) => {
    const password = prompt('Enter your vault password to decrypt:');
    if (!password) return;
    try {
      const decrypted = await decryptData(item.encrypted, password);
      onDecrypted(decrypted);
      setShowVault(false);
    } catch {
      alert('Decryption failed. Incorrect password?');
    }
  }, []);

  return {
    showVault,
    setShowVault,
    vaultPassword,
    setVaultPassword,
    deleteFromVault,
    loadFromVault,
  };
}

export function useSavedAnalyses() {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('contractcheck_vault');
    if (saved) {
      try { setSavedAnalyses(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveToVault = useCallback(async (analysis: any, rawText: string, privateNotes: Record<number, string>) => {
    const password = prompt('Enter a password to encrypt this analysis:');
    if (!password) return;

    try {
      const encrypted = await encryptData({
        analysis,
        rawText,
        privateNotes,
        timestamp: new Date().toISOString(),
      }, password);

      const newSaved = [...savedAnalyses, {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        encrypted,
      }];
      setSavedAnalyses(newSaved);
      localStorage.setItem('contractcheck_vault', JSON.stringify(newSaved));
      alert('Analysis saved securely to your local vault.');
    } catch (err) {
      alert('Failed to save: ' + err);
    }
  }, [savedAnalyses]);

  return { savedAnalyses, setSavedAnalyses, saveToVault };
}