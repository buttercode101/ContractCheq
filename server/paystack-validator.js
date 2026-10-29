const crypto = require('crypto')

export function validatePaystackReference(reference, secretKey) {
  if (!reference || !secretKey) {
    throw new Error('Reference and secret key are required')
  }
  
  // Basic validation for Paystack reference format
  const referenceRegex = /^pb_\d{10,12}$/i
  if (!referenceRegex.test(reference)) {
    throw new Error('Invalid Paystack reference format')
  }
  
  // Simulate Paystack verification (in a real app, call Paystack API)
  return {
    status: 'success',
    verified: true,
    amount: 1900, // R19.00
    currency: 'ZAR'
  }
}

export function validatePaystackPayment(paymentData) {
  if (!paymentData || !paymentData.reference || !paymentData.amount) {
    throw new Error('Payment data is incomplete')
  }
  
  // Validate amount is a positive number
  if (typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
    throw new Error('Invalid payment amount')
  }
  
  return {
    status: 'success',
    verified: true,
    paymentReference: paymentData.reference
  }
}
