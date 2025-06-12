import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import Tesseract from 'tesseract.js'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const upload = multer()

// Initialize Supabase client
const supabaseUrl = 'https://jruqvzpclhwjkttxhhtt.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydXF2enBjbGh3amt0dHhoaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE3NDQ3NSwiZXhwIjoyMDYzNzUwNDc1fQ.GMZ5LuxejrOCiuqmgDTE3GJZWX1Jjj7ggpodB7UDrQk'
const supabase = createClient(supabaseUrl, supabaseKey)

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
const ARTIFACTS_PUBLIC_URL = 'https://pub-8c8eb005cca947a7821974e5e66ea477.r2.dev/artifacts/'
const DOCUMENTS_PUBLIC_URL = 'https://pub-8c8eb005cca947a7821974e5e66ea477.r2.dev/documents/'

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file

  if (!file || (!file.originalname.endsWith('.glb') && !file.originalname.endsWith('.pdf'))) {
    return res.status(400).json({ error: 'Only .glb and .pdf files are allowed.' })
  }

  const documentsKey = `documents/${file.originalname}`
  const artifactsKey = `artifacts/${file.originalname}`

  try {
    if (file.originalname.endsWith('.pdf')) {
      const form = new FormData()
      form.append('file', file.buffer, file.originalname)

      const nlpRes = await axios.post('http://localhost:8000/process-text', form, {
        headers: form.getHeaders(),
      })

      console.log('NLP response:', nlpRes.data)

      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: documentsKey,
        Body: file.buffer,
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
      })

      await s3.send(putCommand)

      const fileUrl = `${DOCUMENTS_PUBLIC_URL}${file.originalname}`

      // Insert metadata into Supabase
      const { error } = await supabase.from('documents_metadata').insert([
        {
          file_name: file.originalname,
          file_url: fileUrl,
          metadata: nlpRes.data,
          uploaded_at: new Date(),
          updated_at: new Date(),
        },
      ])

      if (error) {
        console.error('Supabase insert error:', error)
        return res
          .status(500)
          .json({ error: 'Failed to save metadata', detail: error.message || error })
      }

      // Return file URL + metadata stored
      return res.json({ url: fileUrl, metadata: nlpRes.data })
    }

    if (file.originalname.endsWith('.glb')) {
      // Upload GLB file to Cloudflare S3
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: artifactsKey,
          Body: file.buffer,
          ContentType: 'model/gltf-binary',
        }),
      )

      const fileUrl = `${ARTIFACTS_PUBLIC_URL}${file.originalname}`

      // Insert metadata into Supabase
      const { error } = await supabase.from('artifacts_metadata').insert([
        {
          file_name: file.originalname,
          file_url: fileUrl,
          uploaded_at: new Date(),
          updated_at: new Date(),
        },
      ])

      if (error) {
        console.error('Supabase insert error:', error)
        return res
          .status(500)
          .json({ error: 'Failed to save metadata', detail: error.message || error })
      }

      const metadataResult = {}

      // Return file URL + metadata stored
      return res.json({
        url: fileUrl,
        metadata: {
          file_name: file.originalname,
          title: metadataResult.title || '',
          author: metadataResult.author || '',
          date: metadataResult.date || '',
          summary: metadataResult.summary || '',
          keywords: metadataResult.keywords || [],
          categories: metadataResult.categories || [],
        },
      })
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'Upload failed.' })
  }
})

// List models route
app.get('/models', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('artifacts_metadata')
      .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching artifacts:', error)
      return res.status(500).json({ error: 'Failed to fetch artifacts metadata' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error listing artifacts:', error)
    res.status(500).json({ error: 'Failed to list artifacts' })
  }
})

// List documents route
app.get('/documents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents_metadata')
      .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching documents:', error)
      return res.status(500).json({ error: 'Failed to fetch documents metadata' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error listing documents:', error)
    res.status(500).json({ error: 'Failed to list documents' })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

app.post('/save-metadata', async (req, res) => {
  const updatedMetadata = req.body

  if (!updatedMetadata.file_name) {
    return res.status(400).json({ error: 'file_name is required' })
  }

  try {
    const isPDF = updatedMetadata.file_name.toLowerCase().endsWith('.pdf')
    const isGLB = updatedMetadata.file_name.toLowerCase().endsWith('.glb')

    // Update the metadata record in Supabase
    if (isPDF) {
      const { error } = await supabase
        .from('documents_metadata')
        .update({ metadata: updatedMetadata.metadata, updated_at: new Date() })
        .eq('file_name', updatedMetadata.file_name)

      if (error) {
        console.error('Supabase update error:', error)
        return res
          .status(500)
          .json({ error: 'Failed to update metadata', detail: error.message || error })
      }
    }

    if (isGLB) {
      const { error } = await supabase
        .from('artifacts_metadata')
        .update({ metadata: updatedMetadata.metadata, updated_at: new Date() })
        .eq('file_name', updatedMetadata.file_name)

      if (error) {
        console.error('Supabase update error:', error)
        return res
          .status(500)
          .json({ error: 'Failed to update metadata', detail: error.message || error })
      }
    }

    return res.json({ message: 'Metadata updated successfully' })
  } catch (err) {
    console.error('Error saving metadata:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/ocr', async (req, res) => {
  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: 'No image provided' })

    const buffer = Buffer.from(image, 'base64')

    const result = await Tesseract.recognize(buffer, 'eng', {
      logger: (m) => console.log(m),
      tessedit_char_whitelist:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}-_"\'',
    })

    console.log('OCR Result:', result.data.text)
    res.json({ text: result.data.text })
  } catch (err) {
    console.error('OCR Error:', err)
    res.status(500).json({ error: 'OCR failed' })
  }
})
