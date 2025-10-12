// NLP Service Configuration
// Centralized configuration for NLP backend URL

/**
 * Get the NLP service base URL from environment variables
 * Falls back to localhost for development
 * @returns {string} The base URL for the NLP service
 */
export const getNlpServiceUrl = () => {
  // Use environment variable if available (Vercel deployment)
  const envUrl = import.meta.env.VITE_NLP_SERVICE_URL

  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, '')
  }

  // Default to localhost for development
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
