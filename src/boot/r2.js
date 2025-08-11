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
    const key = `${folder}/${fileName}`

    await r2.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: file.stream ? file.stream() : file,
        ContentType: file.type || 'application/octet-stream',
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
