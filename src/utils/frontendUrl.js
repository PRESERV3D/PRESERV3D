// Resolve the frontend base URL for use in email redirect links.
// Prefer VITE_FRONTEND_URL (set in environment on deployment). Fall back to
// window.location.origin when running in browser, or a sensible localhost dev URL.
export function getFrontendUrl() {
  try {
    const envUrl = import.meta.env?.VITE_FRONTEND_URL
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') return envUrl.replace(/\/$/, '')
  } catch {
    // import.meta may not be available in some test environments
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/$/, '')
  }

  // Safe default for dev if nothing else is set
  return 'http://localhost:9000'
}
