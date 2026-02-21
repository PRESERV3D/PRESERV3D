import { boot } from 'quasar/wrappers'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCachedUrl, setCachedUrl } from 'src/utils/urlCache'

const r2BucketName = import.meta.env.VITE_R2_BUCKET_NAME

const r2 = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Generate a presigned URL for accessing R2 objects
 * @param {string} key - The object key (e.g., "artifacts/model.glb")
 * @param {number} expiresIn - URL expiration time in seconds (default: 7 days)
 * @returns {Promise<string>} - Presigned URL
 */
async function getPresignedUrl(key, expiresIn = 604800) {
  try {
    // Check cache first
    const cachedUrl = getCachedUrl(key)
    if (cachedUrl) {
      return cachedUrl
    }

    // Generate new presigned URL
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    })

    const url = await getSignedUrl(r2, command, { expiresIn })

    // Cache the generated URL
    setCachedUrl(key, url)

    return url
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

/**
 * Get R2 URL - generates presigned URL directly
 * @param {string} folder - The folder name (e.g., "artifacts", "documents")
 * @param {string} fileName - The file name
 * @returns {Promise<string>} - Presigned URL
 */
async function getR2Url(folder, fileName) {
  const key = `${folder}/${fileName}`
  return await getPresignedUrl(key)
}

async function uploadFileToR2(file, folder, fileName) {
  try {
    const buffer = await file.arrayBuffer()
    const key = `${folder}/${fileName}`

    // Detect file extension and set MIME type
    const ext = fileName.split('.').pop().toLowerCase()
    let contentType = file.type || 'application/octet-stream'

    if (ext === 'glb' || ext === 'gltf') {
      contentType = 'model/gltf-binary'
    } else if (ext === 'pdf') {
      contentType = 'application/pdf'
    }

    await r2.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )

    // Generate presigned URL for the uploaded file
    const presignedUrl = await getPresignedUrl(key)

    return {
      error: null,
      publicUrl: presignedUrl,
      key: key,
    }
  } catch (err) {
    return { error: err, publicUrl: null, key: null }
  }
}

/**
 * Delete a file from R2
 * @param {string} folder - The folder name (e.g., "visitor-letters", "artifacts")
 * @param {string} fileName - The file name to delete
 * @returns {Promise<{error: Error|null}>}
 */
async function deleteFileFromR2(folder, fileName) {
  try {
    const key = `${folder}/${fileName}`

    await r2.send(
      new DeleteObjectCommand({
        Bucket: r2BucketName,
        Key: key,
      }),
    )

    return { error: null }
  } catch (err) {
    console.error('Error deleting file from R2:', err)
    return { error: err }
  }
}

export default boot(({ app }) => {
  app.config.globalProperties.$r2Upload = uploadFileToR2
  app.config.globalProperties.$getR2Url = getR2Url
  app.config.globalProperties.$getPresignedUrl = getPresignedUrl
  app.config.globalProperties.$deleteFileFromR2 = deleteFileFromR2
})

export { uploadFileToR2, getR2Url, getPresignedUrl, deleteFileFromR2 }
