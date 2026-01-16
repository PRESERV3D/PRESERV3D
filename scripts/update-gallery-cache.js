#!/usr/bin/env node

/**
 * Update Gallery.pck metadata in R2 for better caching and delivery
 * Adds cache-control and gzip headers for faster loading
 */

import { S3Client, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
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

  envContent.split(/\r?\n/).forEach((line) => {
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

const R2_ENDPOINT = envVars.VITE_R2_ENDPOINT || process.env.VITE_R2_ENDPOINT
const R2_ACCESS_KEY_ID = envVars.VITE_R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY =
  envVars.VITE_R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = envVars.VITE_R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('Error: Missing R2 environment variables')
  process.exit(1)
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

async function updateGalleryPckMetadata() {
  try {
    const key = 'godot-gallery/Gallery.pck'

    console.log(`📦 Checking Gallery.pck metadata in R2...`)

    // Head object to see current metadata
    const headCommand = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
    const headResponse = await s3Client.send(headCommand)
    console.log(`✓ Current size: ${(headResponse.ContentLength / 1024 / 1024).toFixed(2)} MB`)
    console.log(`✓ Current content-type: ${headResponse.ContentType}`)
    console.log(`✓ Current cache-control: ${headResponse.CacheControl || 'Not set'}`)

    console.log(`\n🔄 Updating metadata with better caching headers...`)

    // Copy object to itself with new metadata
    const copyCommand = new CopyObjectCommand({
      Bucket: R2_BUCKET_NAME,
      CopySource: `${R2_BUCKET_NAME}/${key}`,
      Key: key,
      ContentType: 'application/octet-stream',
      CacheControl: 'public, max-age=31536000', // 1 year cache (file is versioned by URL)
      MetadataDirective: 'REPLACE',
    })

    const copyResponse = await s3Client.send(copyCommand)

    console.log(`✓ Metadata updated!`)
    console.log(`✓ ETag: ${copyResponse.CopyObjectResult.ETag}`)
    console.log(`\n✅ Gallery.pck now has optimal caching headers:`)
    console.log(`   Content-Type: application/octet-stream`)
    console.log(`   Cache-Control: public, max-age=31536000 (1 year)`)
    console.log(`\n💡 Browser will cache this file aggressively since the URL changes per version.`)
  } catch (error) {
    console.error('❌ Update failed:', error.message)
    if (error.Code) {
      console.error(`Error Code: ${error.Code}`)
    }
    process.exit(1)
  }
}

updateGalleryPckMetadata()
