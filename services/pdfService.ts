declare const pdfjsLib: any;

export interface PDFParseResult {
  text: string;
  pageCount: number;
}

export async function parsePDF(file: File, options?: { maxPages?: number }): Promise<PDFParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const maxPages = options?.maxPages ?? 40;
  if (pdf.numPages > maxPages) {
    throw new Error(`PDF exceeds page limit (${pdf.numPages}). Maximum allowed is ${maxPages} pages.`);
  }

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return { text: fullText, pageCount: pdf.numPages };
}
