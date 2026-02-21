/**
 * Get the NLP service base URL from environment variables
 * Falls back to localhost for development
 * @returns {string} The base URL for the NLP service
 */
export const getNlpServiceUrl = () => {
  // Environment override to force using local NLP service
  const forceLocal = import.meta.env.VITE_FORCE_LOCAL_NLP === 'true'

  // Use localhost when running the app on localhost or when explicitly forced
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  if (isLocalHost || forceLocal) {
    return 'http://localhost:8000'
  }

  // Use environment variable if available (deployed environments)
  const envUrl = import.meta.env.VITE_NLP_SERVICE_URL
  if (envUrl) {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      // Only warn in dev console
      console.warn(
        'Using deployed NLP service from VITE_NLP_SERVICE_URL while running on localhost. To force local NLP set VITE_FORCE_LOCAL_NLP=true in your .env',
      )
    }
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, '')
  }

  // Fallback to localhost as a safe default
  return 'http://localhost:8000'
}

/**
 * Get the full NLP endpoint URL
 * @param {string} endpoint - The endpoint path (e.g., '/process-text')
 * @returns {string} The full URL
 */
export const getNlpEndpoint = (endpoint) => {
  const baseUrl = getNlpServiceUrl()
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${path}`
}

// Export the base URL as a constant for convenience
export const NLP_SERVICE_URL = getNlpServiceUrl()
