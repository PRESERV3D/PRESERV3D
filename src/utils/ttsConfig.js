/**
 * Get the TTS service base URL from environment variables
 * Falls back to localhost for development
 * @returns {string} The base URL for the TTS service
 */
export const getTtsServiceUrl = () => {
  // Environment override to force using local TTS service
  const forceLocal = import.meta.env.VITE_FORCE_LOCAL_TTS === 'true'

  // Use localhost when running the app on localhost or when explicitly forced
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  if (isLocalHost || forceLocal) {
    return 'http://localhost:8001'
  }

  // Use environment variable if available (deployed environments)
  const envUrl = import.meta.env.VITE_TTS_SERVICE_URL
  if (envUrl) {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      // Only warn in dev console
      console.warn(
        'Using deployed TTS service from VITE_TTS_SERVICE_URL while running on localhost. To force local TTS set VITE_FORCE_LOCAL_TTS=true in your .env',
      )
    }
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, '')
  }

  // Fallback to localhost as a safe default
  return 'http://localhost:8001'
}

/**
 * Get the full TTS endpoint URL
 * @param {string} endpoint - The endpoint path (e.g., '/generate-tts')
 * @returns {string} The full URL
 */
export const getTtsEndpoint = (endpoint) => {
  const baseUrl = getTtsServiceUrl()
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${path}`
}

// Export the base URL as a constant for convenience
export const TTS_SERVICE_URL = getTtsServiceUrl()
