import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import Tesseract from 'tesseract.js'
import { createClient } from '@supabase/supabase-js'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

// Initialize Supabase client
const supabaseUrl = 'https://jruqvzpclhwjkttxhhtt.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydXF2enBjbGh3amt0dHhoaHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODE3NDQ3NSwiZXhwIjoyMDYzNzUwNDc1fQ.GMZ5LuxejrOCiuqmgDTE3GJZWX1Jjj7ggpodB7UDrQk'
const supabase = createClient(supabaseUrl, supabaseKey)

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
