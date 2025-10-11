/**
 * Composable for handling R2 and Supabase Storage URLs - converts stored URLs to working presigned URLs
 */
import { getPresignedUrl, getR2Url } from 'src/boot/r2'
import { preloadUrls, preloadPreviews } from 'src/utils/urlCache'
import { convertSupabaseUrl, isSupabaseStorageUrl } from 'src/utils/supabaseCache'

/**
 * Extract the key (folder/filename) from a stored R2 URL
 * @param {string} url - The stored URL (could be public or old format)
 * @returns {string|null} - The extracted key or null
 */
function extractKeyFromUrl(url) {
  if (!url) return null

  try {
    // Handle different URL formats
    // Format 1: https://pub-xxxxx.r2.dev/artifacts/file.glb
    // Format 2: https://endpoint.r2.cloudflarestorage.com/bucket/artifacts/file.glb
    // Format 3: artifacts/file.glb (already a key)

    // If it's already a key pattern (no http/https)
    if (!url.startsWith('http')) {
      return url
    }

    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Remove leading slash
    let key = pathname.startsWith('/') ? pathname.substring(1) : pathname

    // If the path includes the bucket name, remove it
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME
    if (bucketName && key.startsWith(`${bucketName}/`)) {
      key = key.substring(bucketName.length + 1)
    }

    // Decode URI components
    key = decodeURIComponent(key)

    return key
  } catch (error) {
    console.error('Error extracting key from URL:', error)
    return null
  }
}

/**
 * Convert a stored URL to a working presigned URL
 * Automatically detects if it's an R2 or Supabase URL
 * @param {string} storedUrl - The URL stored in the database
 * @returns {Promise<string>} - Working presigned URL
 */
export async function convertToWorkingUrl(storedUrl) {
  if (!storedUrl) {
    throw new Error('No URL provided')
  }

  // Check if it's a Supabase Storage URL
  if (isSupabaseStorageUrl(storedUrl)) {
    try {
      return await convertSupabaseUrl(storedUrl)
    } catch (error) {
      console.error('Error converting Supabase URL:', error)
      throw error
    }
  }

  // Otherwise, treat as R2 URL
  const key = extractKeyFromUrl(storedUrl)

  if (!key) {
    throw new Error('Could not extract key from URL: ' + storedUrl)
  }

  // Generate a presigned URL for R2
  try {
    return await getPresignedUrl(key)
  } catch (error) {
    console.error('Error generating presigned URL for key:', key, error)
    throw error
  }
}

/**
 * Get R2 URL by folder and filename
 * @param {string} folder - The folder name
 * @param {string} fileName - The file name
 * @returns {Promise<string>} - Working URL
 */
export async function getFileUrl(folder, fileName) {
  return await getR2Url(folder, fileName)
}

/**
 * Composable for R2 URL management with caching and preloading
 */
export function useR2Url() {
  return {
    convertToWorkingUrl,
    getFileUrl,
    extractKeyFromUrl,
    preloadUrls,
    preloadPreviews,
  }
}
