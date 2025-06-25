import { boot } from 'quasar/wrappers'
import { S3Client } from '@aws-sdk/client-s3'

const r2Bucket = import.meta.env.VITE_R2_BUCKET
const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL

const r2 = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY,
  },
})

export default boot(({ app }) => {
  app.config.globalProperties.$r2 = r2
  app.config.globalProperties.$r2Bucket = r2Bucket
  app.config.globalProperties.$r2PublicUrl = r2PublicUrl
})

export { r2, r2Bucket, r2PublicUrl }
