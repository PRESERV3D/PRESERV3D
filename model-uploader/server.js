import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
import bcrypt from 'bcrypt'
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const upload = multer()

// Initialize Supabase client
const supabaseUrl = 'https://jruqvzpclhwjkttxhhtt.supabase.co' // Replace with your Supabase URL
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

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`)
// })

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

// Register user route
app.post('/register-user', async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    contact,
    college,
    department,
    year_section,
    is_alumni,
    password,
  } = req.body

  // if (!email.endsWith('@iskolarngbayan.pup.edu.ph')) {
  //   return res.status(400).json({ error: 'Only PUP email addresses are allowed.' })
  // }

  // if (
  //   !first_name ||
  //   !last_name ||
  //   !email ||
  //   !contact ||
  //   !college ||
  //   !department ||
  //   !year_section ||
  //   !password
  // ) {
  //   return res.status(400).json({ error: 'Please fill in all required fields.' })
  // }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        'Password must be at least 8 characters long and contain an uppercase letter, a number, and a special character.',
    })
  }

  try {
    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabase
      .from('registered_pup_students')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('Supabase select error:', existingError)
      return res.status(500).json({ error: 'Error checking existing user.' })
    }

    if (existingUser) {
      return res.status(409).json({ error: 'User already registered with this email.' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert into Supabase
    const { error: insertError } = await supabase.from('registered_pup_students').insert([
      {
        first_name,
        last_name,
        email,
        contact,
        college,
        department,
        year_section,
        is_alumni,
        password: hashedPassword,
      },
    ])

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to register user.' })
    }

    res.status(201).json({ message: 'User registered successfully.' })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ error: 'Server error during registration.' })
  }
})

// Login user route
const loginAttempts = {} // { "email": { count: 0, lastAttempt: timestamp } }

const MAX_ATTEMPTS = 3
const COOLDOWN_TIME = 3 * 60 * 1000 // 3 minutes

app.post('/login-user', async (req, res) => {
  const { email, password } = req.body

  const now = Date.now()

  if (!loginAttempts[email]) {
    loginAttempts[email] = { count: 0, lastAttempt: 0 }
  }

  const attempts = loginAttempts[email]

  // Cooldown check
  if (attempts.count >= MAX_ATTEMPTS) {
    const timeSince = now - attempts.lastAttempt
    if (timeSince < COOLDOWN_TIME) {
      const wait = Math.ceil((COOLDOWN_TIME - timeSince) / 1000)
      return res.status(403).json({
        error: `Too many login attempts. Try again in ${wait} seconds.`,
      })
    } else {
      attempts.count = 0
      attempts.lastAttempt = 0
    }
  }

  try {
    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('registered_pup_students')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Supabase select error:', error)
      return res.status(500).json({ error: 'Error fetching user.' })
    }

    if (!user) {
      attempts.count++
      attempts.lastAttempt = now
      return res.status(404).json({ error: 'User not found.' })
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)

    // Password attempt tracking
    if (!isPasswordValid) {
      attempts.count++
      attempts.lastAttempt = now
      const left = MAX_ATTEMPTS - attempts.count

      if (left <= 0) {
        return res.status(401).json({
          error: `Too many failed attempts. Try again in ${Math.ceil(COOLDOWN_TIME / 1000)} seconds.`,
        })
      }

      return res.status(401).json({
        error: `Invalid password. You have ${left} attempt/s left.`,
      })
    }

    // Reset attempts on successful login
    loginAttempts[email] = { count: 0, lastAttempt: 0 }

    // Return user data without password
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userData } = user
    return res.json(userData)
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Server error during login.' })
  }
})

// Register admin route
app.post('/register-admin', async (req, res) => {
  const { first_name, last_name, email, contact, password } = req.body

  // if (!email.endsWith('@iskolarngbayan.pup.edu.ph')) {
  //   return res.status(400).json({ error: 'Only PUP email addresses are allowed.' })
  // }

  // if (
  //   !first_name ||
  //   !last_name ||
  //   !email ||
  //   !contact ||
  //   !password
  // ) {
  //   return res.status(400).json({ error: 'Please fill in all required fields.' })
  // }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        'Password must be at least 8 characters long and contain an uppercase letter, a number, and a special character.',
    })
  }

  try {
    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabase
      .from('registered_admins')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('Supabase select error:', existingError)
      return res.status(500).json({ error: 'Error checking existing user.' })
    }

    if (existingUser) {
      return res.status(409).json({ error: 'User already registered with this email.' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert into Supabase
    const { error: insertError } = await supabase.from('registered_admins').insert([
      {
        first_name,
        last_name,
        email,
        contact,
        password: hashedPassword,
      },
    ])

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to register user.' })
    }

    res.status(201).json({ message: 'User registered successfully.' })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ error: 'Server error during registration.' })
  }
})

// Login admin route
const loginAttemptsAdmin = {} // { "email": { count: 0, lastAttempt: timestamp } }

app.post('/login-admin', async (req, res) => {
  const { email, password } = req.body

  const now = Date.now()

  if (!loginAttemptsAdmin[email]) {
    loginAttemptsAdmin[email] = { count: 0, lastAttempt: 0 }
  }

  const attempts = loginAttemptsAdmin[email]

  // Cooldown check
  if (attempts.count >= MAX_ATTEMPTS) {
    const timeSince = now - attempts.lastAttempt
    if (timeSince < COOLDOWN_TIME) {
      const wait = Math.ceil((COOLDOWN_TIME - timeSince) / 1000)
      return res.status(403).json({
        error: `Too many login attempts. Try again in ${wait} seconds.`,
      })
    } else {
      attempts.count = 0
      attempts.lastAttempt = 0
    }
  }

  try {
    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('registered_admins')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Supabase select error:', error)
      return res.status(500).json({ error: 'Error fetching user.' })
    }

    if (!user) {
      attempts.count++
      attempts.lastAttempt = now
      return res.status(404).json({ error: 'User not found.' })
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)

    // Password attempt tracking
    if (!isPasswordValid) {
      attempts.count++
      attempts.lastAttempt = now
      const left = MAX_ATTEMPTS - attempts.count

      if (left <= 0) {
        return res.status(401).json({
          error: `Too many failed attempts. Try again in ${Math.ceil(COOLDOWN_TIME / 1000)} seconds.`,
        })
      }

      return res.status(401).json({
        error: `Invalid password. You have ${left} attempt/s left.`,
      })
    }

    // Reset attempts on successful login
    loginAttemptsAdmin[email] = { count: 0, lastAttempt: 0 }

    // Return user data without password
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userData } = user
    return res.json(userData)
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Server error during login.' })
  }
})

// app.get('/', (req, res) => {
//   res.send('Backend is working!')
// })

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
