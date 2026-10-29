const express = require('express')
const helmet = require('helmet')
const multer = require('multer')
const { createRateLimiter } = require('./rate-limiter')
const { validatePaystackReference, validatePaystackPayment } = require('./paystack-validator')

const app = express()
app.use(helmet())
createRateLimiter(app)

// Middleware for file uploads
const upload = multer()

// Add Paystack validation middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/verify-payment')) {
    try {
      const result = validatePaystackPayment(req.body)
      req.paystackValidation = result
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }
  next()
})

// Add Paystack verification endpoint
app.post('/api/verify-payment', (req, res) => {
  if (!req.paystackValidation || !req.paystackValidation.verified) {
    return res.status(400).json({ error: 'Payment verification failed' })
  }
  res.json({
    success: true,
    message: 'Payment verified successfully'
  })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
