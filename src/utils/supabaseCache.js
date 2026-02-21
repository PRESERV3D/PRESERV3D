import { supabase } from 'boot/supabase'
import { getCachedUrl, setCachedUrl } from './urlCache'

/**
 * Get signed URL from Supabase storage with caching
 * @param {string} bucket - Storage bucket name (e.g., 'artifacts', 'documents')
 * @param {string} path - File path in the bucket
 * @param {number} expiresIn - URL expiration time in seconds (default: 6 days)
 * @returns {Promise<string>} - Signed URL
 */
export async function getSupabaseSignedUrl(bucket, path, expiresIn = 518400) {
  if (!bucket || !path) {
    throw new Error('Bucket and path are required')
  }

  const cacheKey = `supabase_${bucket}/${path}`

  // Check cache first
  const cachedUrl = getCachedUrl(cacheKey)
  if (cachedUrl) {
    return cachedUrl
  }

  // Generate new signed URL
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      throw error
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned from Supabase')
    }

    // Cache the URL
    setCachedUrl(cacheKey, data.signedUrl)

    return data.signedUrl
  } catch (error) {
    console.error('Error getting Supabase signed URL:', error)
    throw error
  }
}

/**
 * Get public URL from Supabase storage (for public buckets)
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in the bucket
 * @returns {string} - Public URL
 */
export function getSupabasePublicUrl(bucket, path) {
  if (!bucket || !path) {
    throw new Error('Bucket and path are required')
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Convert Supabase storage URL to working signed URL
 * Handles both public and storage URLs
 * @param {string} url - The stored Supabase URL
 * @returns {Promise<string>} - Working signed URL
 */
export async function convertSupabaseUrl(url) {
  if (!url) {
    throw new Error('No URL provided')
  }

  // If it's already a signed URL (has token), return it
  if (url.includes('token=')) {
    return url
  }

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Match pattern: /storage/v1/object/public/<bucket>/<path> or /storage/v1/object/<bucket>/<path>
    const match = pathname.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)/)

    if (!match) {
      console.warn('Could not parse Supabase URL, returning original:', url)
      return url
    }

    const bucket = match[1]
    const path = decodeURIComponent(match[2])

    // Get signed URL with caching
    return await getSupabaseSignedUrl(bucket, path)
  } catch (error) {
    console.warn('Error converting Supabase URL, returning original:', error)
    return url
  }
}

/**
 * Batch convert multiple Supabase URLs with caching
 * @param {Array<string>} urls - Array of Supabase URLs
 * @returns {Promise<Array<string>>} - Array of working signed URLs
 */
export async function batchConvertSupabaseUrls(urls) {
  if (!urls || urls.length === 0) return []

  return await Promise.all(
    urls.map(async (url) => {
      try {
        return await convertSupabaseUrl(url)
      } catch (error) {
        console.warn('Failed to convert URL:', url, error)
        return url // Return original on error
      }
    }),
  )
}

/**
 * Check if URL is from Supabase storage
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a Supabase storage URL
 */
export function isSupabaseStorageUrl(url) {
  if (!url) return false
  return url.includes('supabase.co/storage/v1/object')
}
