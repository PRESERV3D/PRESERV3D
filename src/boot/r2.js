import { boot } from 'quasar/wrappers'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2BucketName = import.meta.env.VITE_R2_BUCKET_NAME
const r2PublicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL

const r2 = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
})

async function uploadFileToR2(file, folder, fileName) {
  try {
    const buffer = await file.arrayBuffer()
    const key = `${folder}/${fileName}`

    // Detect file extension and set MIME type
    const ext = fileName.split('.').pop().toLowerCase()
    let contentType = file.type || 'application/octet-stream'

    if (ext === 'glb' || ext === 'gltf') {
      contentType = 'model/gltf-binary'
    }

    await r2.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )

    return {
      error: null,
      publicUrl: `${r2PublicBaseUrl}/${encodeURIComponent(key)}`,
    }
  } catch (err) {
    return { error: err, publicUrl: null }
  }
}

export default boot(({ app }) => {
  app.config.globalProperties.$r2Upload = uploadFileToR2
})

export { uploadFileToR2 }
