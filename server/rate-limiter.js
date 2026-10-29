const rateLimit = require('express-rate-limit')

export function createRateLimiter(app) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  })
  
  // Apply rate limiting to sensitive endpoints
  app.use('/api/verify-payment', limiter)
  app.use('/api/analyze', limiter)
  app.use('/api/unlock-report', limiter)
}
