const { withRetry, retryableError } = require('./retry-logic')

export function applyRetryMiddleware(app) {
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
            return { success: true, text }
          } else {
            return { success: true, text: req.body.text }
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
}
