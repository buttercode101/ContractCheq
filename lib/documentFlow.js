export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 40;
export const PDF_DENSITY_THRESHOLD = 250;

export function validateUpload(file) {
  if (!file) throw new Error('No file selected.');

  const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  const isImage = file.type?.startsWith('image/');

  if (!isPdf && !isImage) {
    const err = new Error('Unsupported format. Upload PDF or image files only.');
    err.code = 'INVALID_FILE_TYPE';
    throw err;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const err = new Error(`File too large. Max upload size is ${Math.floor(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB.`);
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  return { isPdf, isImage };
}

export function estimateAnalysisConfidence({ text, usedOCR, denseChars, pageCount }) {
  const t = String(text || '');
  const chars = t.length;
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  const noiseChars = (t.match(/[^\w\s.,;:'"!?()\-/%]/g) || []).length;
  const noiseRatio = chars ? noiseChars / chars : 1;

  let score = usedOCR ? 68 : 92;
  if (denseChars < PDF_DENSITY_THRESHOLD) score -= 12;
  if (words < 80) score -= 10;
  if (noiseRatio > 0.12) score -= 10;
  if (pageCount && pageCount > 20) score -= 5;

  score = Math.max(5, Math.min(99, Math.round(score)));

  const warning = score < 75
    ? 'Low extraction confidence. OCR artifacts may reduce legal analysis accuracy.'
    : null;

  return { score, warning };
}

export async function runDocumentPipeline(file, deps) {
  const { parsePdf, extractOcr } = deps;
  const { isPdf, isImage } = validateUpload(file);

  if (isImage) {
    const text = await extractOcr(file);
    return {
      text,
      usedOCR: true,
      source: 'image_ocr',
      pageCount: 1,
      denseChars: text.replace(/\s+/g, '').length
    };
  }

  const parsed = await parsePdf(file, { maxPages: MAX_PDF_PAGES });
  const pdfText = typeof parsed === 'string' ? parsed : parsed.text;
  const pageCount = typeof parsed === 'string' ? undefined : parsed.pageCount;
  const denseChars = pdfText.replace(/\s+/g, '').length;

  if (denseChars >= PDF_DENSITY_THRESHOLD) {
    return { text: pdfText, usedOCR: false, source: 'pdf_text', pageCount, denseChars };
  }

  const text = await extractOcr(file);
  return { text, usedOCR: true, source: 'pdf_ocr_fallback', pageCount, denseChars };
}
