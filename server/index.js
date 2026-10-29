/**
 * ContractCheck SA v3 — production server
 * Upload → OCR/text → SA/UK rules → optional AI enrichment → freemium unlock → Paystack verify
 */
if (process.env.NODE_ENV !== 'test') require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { analyseContract } = require('./riskEngine');
const { validatePerspective } = require('./reportContext');
const DEMO_SAMPLES = require('./demoSamples');
const store = require('./store');
const { SITE_ORIGIN, canonicalHost } = require('./siteConfig');
const { withRetry, retryableError } = require('./retry-logic');

const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_MB = process.env.VERCEL ? 4 : (Number(process.env.MAX_FILE_MB) || 12);
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY || '';
const MAX_TEXT_CHARS = 200000;
const PRICES = { single: 1900, pack3: 3900, pack10: 9900 };
const { aiPolicy, openrouterBody } = require('./aiPolicy');
const AI_POLICY = aiPolicy();
const AI_ENRICHMENT_MAX_CHARS = AI_POLICY.maxChars;
const OPENROUTER_API_KEY = String(process.env.OPENROUTER_API_KEY || '').trim();
const OPENROUTER_MODEL = AI_POLICY.model;

store.ensure();

const app = express();
app.set('trust proxy', 1);
app.use(canonicalHost);
app.use(helmet({ contentSecurityPolicy: false }));
app.use((_req,res,next)=>{res.set(require('./securityHeaders').securityHeaders());next();});
app.use('/api', (_req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }))

// Add retry middleware for storage operations
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/analyze') || req.path.startsWith('/api/analyze-text')) {
    try {
      await withRetry(async () => {
        // Simulate storage operation
        if (req.path.startsWith('/api/analyze')) {
          const form = new multer().any()
          const [file] = req.files
          if (!file) throw new Error('No file provided')
          const text = file.buffer.toString('utf8')
          return analyseContract(text, 'ZA')
        } else {
          return analyseContract(req.body.text, 'ZA')
        }
      })
      next()
    } catch (error) {
      if (retryableError(error)) {
        res.set('Retry-After', '300').status(503).json({
          code: 'STORAGE_UNAVAILABLE',
          error: 'Private report storage is temporarily unavailable. Please try again later.'
        })
      } else {
        next(error)
      }
    }
  } else {
    next()
  }
})

// Start server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
