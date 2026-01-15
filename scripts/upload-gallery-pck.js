#!/usr/bin/env node

/**
 * Upload Gallery.pck to Cloudflare R2 storage
 * Usage: node scripts/upload-gallery-pck.js
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read .env file directly
function loadEnv() {
  const envPath = resolve(__dirname, '../.env')
  const envContent = readFileSync(envPath, 'utf-8')
  const env = {}
  
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex > 0) {
        const name = trimmed.substring(0, eqIndex).trim()
        const value = trimmed.substring(eqIndex + 1).trim()
        env[name] = value
      }
    }
  })
  
  return env
}

const envVars = loadEnv()

// Get R2 credentials from environment variables
const R2_ENDPOINT = envVars.VITE_R2_ENDPOINT || process.env.VITE_R2_ENDPOINT
const R2_ACCESS_KEY_ID = envVars.VITE_R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = envVars.VITE_R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = envVars.VITE_R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME
const R2_PUBLIC_URL = envVars.VITE_R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('Error: Missing R2 environment variables')
  console.error('Make sure these are set in your .env file:')
  console.error('  - VITE_R2_ENDPOINT')
  console.error('  - VITE_R2_ACCESS_KEY_ID')
  console.error('  - VITE_R2_SECRET_ACCESS_KEY')
  console.error('  - VITE_R2_BUCKET_NAME')
  console.error('  - VITE_R2_PUBLIC_URL')
  process.exit(1)
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
})

async function uploadGalleryPck() {
  try {
    const pckPath = resolve(__dirname, '../public/godot_gallery/Gallery.pck')
    
    console.log(`📦 Reading Gallery.pck from: ${pckPath}`)
    const fileBuffer = readFileSync(pckPath)
    console.log(`✓ File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`)

    console.log(`\n🚀 Uploading to R2 bucket: ${R2_BUCKET_NAME}`)
    
    const uploadParams = {
      Bucket: R2_BUCKET_NAME,
      Key: 'godot-gallery/Gallery.pck',
      Body: fileBuffer,
      ContentType: 'application/octet-stream',
      CacheControl: 'public, max-age=3600'
    }

    const command = new PutObjectCommand(uploadParams)
    const response = await s3Client.send(command)
    
    console.log(`✓ Upload successful!`)
    console.log(`✓ ETag: ${response.ETag}`)
    
    const publicUrl = `${R2_PUBLIC_URL}/godot-gallery/Gallery.pck`
    console.log(`\n✅ Gallery.pck is now available at:`)
    console.log(`${publicUrl}`)
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message)
    if (error.Code) {
      console.error(`Error Code: ${error.Code}`)
    }
    process.exit(1)
  }
}

uploadGalleryPck()
