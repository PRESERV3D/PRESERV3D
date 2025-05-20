const express = require('express')
const cors = require('cors')
const multer = require('multer')
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3')

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const upload = multer()

// R2 S3 client config
const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://4d7ff682acc1284a3ea9e111bdae405f.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'ed2234614d4e282fa0b1ed5db746fc27',
    secretAccessKey: '2511cad158d6240546b9e5b83b13258e0e895ffbfbca394afe7954931cf3f72f',
  },
})

const BUCKET_NAME = 'preserv3d'
const PUBLIC_URL = 'https://pub-8c8eb005cca947a7821974e5e66ea477.r2.dev/artifacts/'

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file

  if (!file || !file.originalname.endsWith('.glb')) {
    return res.status(400).json({ error: 'Only .glb files are allowed.' })
  }

  const key = `artifacts/${file.originalname}`

  try {
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: 'model/gltf-binary',
      ACL: 'public-read',
    })

    await s3.send(putCommand)

    const fileUrl = `${PUBLIC_URL}${file.originalname}`
    res.json({ url: fileUrl })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Upload failed.' })
  }
})

// List models route
app.get('/models', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'artifacts/',
    })

    const data = await s3.send(command)

    const urls = (data.Contents || [])
      .filter((obj) => obj.Key.endsWith('.glb'))
      .map((obj) => `${PUBLIC_URL}${obj.Key.replace('artifacts/', '')}`)

    res.json(urls)
  } catch (error) {
    console.error('Error listing models:', error)
    res.status(500).json({ error: 'Failed to list models' })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
