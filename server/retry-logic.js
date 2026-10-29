const retry = require('async-retry')

export async function withRetry(fn, options = {}) {
  const defaults = {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 5000,
    onRetry: (error, attempt) => {
      console.log(`Retrying in ${options.minTimeout}ms (attempt ${attempt})`)
    }
  }
  const config = { ...defaults, ...options }

  return retry(async (bail) => {
    try {
      return await fn()
    } catch (error) {
      if (error.code === 'PRECONDITION_FAILED' || error.code === 'UNAUTHORIZED' || error.code === 'STORE_SUSPENDED') {
        throw error
      }
      throw bail(error)
    }
  }, config)
}

export function retryableError(error) {
  return error.code === 'PRECONDITION_FAILED' || error.code === 'UNAUTHORIZED' || error.code === 'STORE_SUSPENDED'
}
