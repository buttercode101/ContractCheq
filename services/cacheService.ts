
import { get, set } from 'idb-keyval';
import { AnalysisResult } from '../types';

export async function generateHash(content: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function getCachedAnalysis(hash: string): Promise<AnalysisResult | null> {
  try {
    const cached = await get(`analysis_${hash}`);
    return cached || null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

export async function cacheAnalysis(hash: string, result: AnalysisResult): Promise<void> {
  try {
    await set(`analysis_${hash}`, result);
  } catch (error) {
    console.error('Cache storage error:', error);
  }
}
