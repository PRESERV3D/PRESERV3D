/**
 * Presigned URL Cache Manager
 * Caches presigned URLs in memory and localStorage to avoid regenerating them repeatedly
 */

const CACHE_PREFIX = 'r2_presigned_'
const CACHE_EXPIRY_MS = 6 * 24 * 60 * 60 * 1000 // 6 days (before 7-day expiration)

// In-memory cache for fast access during session
const memoryCache = new Map()

/**
 * Generate cache key from R2 object key
 */
function getCacheKey(key) {
  return `${CACHE_PREFIX}${key}`
}

/**
 * Check if cached URL is still valid (not expired)
 */
function isCacheValid(cacheEntry) {
  if (!cacheEntry || !cacheEntry.url || !cacheEntry.timestamp) {
    return false
  }

  const now = Date.now()
  const age = now - cacheEntry.timestamp

  return age < CACHE_EXPIRY_MS
}

/**
 * Get URL from cache (memory first, then localStorage)
 */
export function getCachedUrl(key) {
  // Try memory cache first (fastest)
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key)
    if (isCacheValid(entry)) {
      return entry.url
    }
    memoryCache.delete(key)
  }

  // Try localStorage cache
  try {
    const cacheKey = getCacheKey(key)
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      const entry = JSON.parse(cached)
      if (isCacheValid(entry)) {
        // Restore to memory cache
        memoryCache.set(key, entry)
        return entry.url
      }

      // Expired, remove it
      localStorage.removeItem(cacheKey)
    }
  } catch (error) {
    console.warn('Error reading from cache:', error)
  }

  return null
}

/**
 * Save URL to cache (both memory and localStorage)
 */
export function setCachedUrl(key, url) {
  const entry = {
    url,
    timestamp: Date.now(),
  }

  // Save to memory cache
  memoryCache.set(key, entry)

  // Save to localStorage
  try {
    const cacheKey = getCacheKey(key)
    localStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch (error) {
    console.warn('Error saving to cache:', error)
  }
}

/**
 * Preload multiple URLs in parallel
 * @param {Array<{key: string}>} items - Array of items with R2 keys
 * @param {Function} generateUrl - Function to generate presigned URL from key
 * @returns {Promise<Array>} - Items with cached URLs
 */
export async function preloadUrls(items, generateUrl) {
  if (!items || items.length === 0) return items

  return await Promise.all(
    items.map(async (item) => {
      if (!item.key) return item

      // Check cache first
      const cachedUrl = getCachedUrl(item.key)
      if (cachedUrl) {
        return { ...item, cachedUrl }
      }

      // Generate and cache new URL
      try {
        const url = await generateUrl(item.key)
        setCachedUrl(item.key, url)
        return { ...item, cachedUrl: url }
      } catch (error) {
        console.warn('Failed to preload URL for:', item.key, error)
        return item
      }
    }),
  )
}

/**
 * Preload image/preview URLs for immediate display
 * Uses link preload for browser optimization
 */
export function preloadPreviews(urls) {
  if (!urls || urls.length === 0) return

  urls.forEach((url) => {
    if (!url) return

    // Create link element for preloading
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

/**
 * Batch fetch URLs with progress tracking
 */
export async function batchFetchUrls(keys, generateUrl, onProgress) {
  const total = keys.length
  let completed = 0

  const results = await Promise.all(
    keys.map(async (key) => {
      const cachedUrl = getCachedUrl(key)

      if (cachedUrl) {
        completed++
        if (onProgress) onProgress(completed, total)
        return { key, url: cachedUrl, cached: true }
      }

      try {
        const url = await generateUrl(key)
        setCachedUrl(key, url)
        completed++
        if (onProgress) onProgress(completed, total)
        return { key, url, cached: false }
      } catch (error) {
        completed++
        if (onProgress) onProgress(completed, total)
        return { key, url: null, error }
      }
    }),
  )

  return results
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache() {
  try {
    const keys = Object.keys(localStorage)
    let cleared = 0

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key)
          const entry = JSON.parse(cached)

          if (!isCacheValid(entry)) {
            localStorage.removeItem(key)
            cleared++
          }
        } catch {
          // Invalid entry, remove it
          localStorage.removeItem(key)
          cleared++
        }
      }
    })

    console.log(`Cleared ${cleared} expired cache entries`)
    return cleared
  } catch (error) {
    console.warn('Error clearing cache:', error)
    return 0
  }
}

/**
 * Clear all cached URLs (useful for debugging)
 */
export function clearAllCache() {
  memoryCache.clear()

  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
    console.log('All URL cache cleared')
  } catch (error) {
    console.warn('Error clearing all cache:', error)
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const memoryCount = memoryCache.size

  let localStorageCount = 0
  let totalSize = 0

  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorageCount++
        const item = localStorage.getItem(key)
        totalSize += item ? item.length : 0
      }
    })
  } catch (error) {
    console.warn('Error getting cache stats:', error)
  }

  return {
    memoryCount,
    localStorageCount,
    totalSizeKB: Math.round(totalSize / 1024),
    expiryDays: CACHE_EXPIRY_MS / (24 * 60 * 60 * 1000),
  }
}
