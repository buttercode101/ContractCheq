import assert from 'node:assert/strict';
import { runDocumentPipeline } from '../lib/documentFlow.js';
import { callGroqAnalyze } from '../lib/providerClient.js';

function fakeFile({ name, type, size = 1024 }) {
  return { name, type, size };
}

async function testCleanPdf() {
  let ocrCalled = 0;
  const result = await runDocumentPipeline(fakeFile({ name: 'clean.pdf', type: 'application/pdf' }), {
    parsePdf: async () => ({ text: 'A'.repeat(300), pageCount: 2 }),
    extractOcr: async () => {
      ocrCalled += 1;
      return 'OCR text';
    }
  });

  assert.equal(result.source, 'pdf_text');
  assert.equal(result.usedOCR, false);
  assert.equal(ocrCalled, 0);
}

async function testScannedPdfFallback() {
  let ocrCalled = 0;
  const result = await runDocumentPipeline(fakeFile({ name: 'scan.pdf', type: 'application/pdf' }), {
    parsePdf: async () => ({ text: 'too short', pageCount: 6 }),
    extractOcr: async () => {
      ocrCalled += 1;
      return 'OCR recovered text '.repeat(30);
    }
  });

  assert.equal(result.source, 'pdf_ocr_fallback');
  assert.equal(result.usedOCR, true);
  assert.equal(ocrCalled, 1);
}

async function testImageOcrPath() {
  let ocrCalled = 0;
  const result = await runDocumentPipeline(fakeFile({ name: 'photo.jpg', type: 'image/jpeg' }), {
    parsePdf: async () => ({ text: '', pageCount: 0 }),
    extractOcr: async () => {
      ocrCalled += 1;
      return 'image ocr text';
    }
  });

  assert.equal(result.source, 'image_ocr');
  assert.equal(result.usedOCR, true);
  assert.equal(ocrCalled, 1);
}

async function testGroqMalformedJsonPath() {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not-json-response' } }] })
    };
  };

  try {
    await callGroqAnalyze('contract text', 'test-key', { systemPrompt: 'json only' });
    assert.fail('Expected callGroqAnalyze to throw on malformed json');
  } catch (err) {
    assert.equal(err.code, 'GROQ_INVALID_JSON');
    assert.equal(calls, 2);
  } finally {
    global.fetch = originalFetch;
  }
}

await testCleanPdf();
await testScannedPdfFallback();
await testImageOcrPath();
await testGroqMalformedJsonPath();

console.log('contract e2e tests passed');
