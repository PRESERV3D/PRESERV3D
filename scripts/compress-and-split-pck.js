#!/usr/bin/env node

/**
 * Compress Gallery.pck and split into chunks for faster loading
 * Uploads gzipped version and creates manifest for chunked downloading
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createGzip } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CHUNK_SIZE = 50 * 1024 * 1024 // 50 MB chunks

// Read .env file
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
const R2_PUBLIC_URL = envVars.VITE_R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL

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

async function compressAndSplit() {
  try {
    const pckPath = resolve(__dirname, '../public/godot_gallery/Gallery.pck')
    const pckBuffer = readFileSync(pckPath)
    const originalSize = pckBuffer.length

    console.log(`📦 Original Gallery.pck: ${(originalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`\n🔄 Compressing with gzip...`)

    // Create gzipped version in memory
    const gzip = createGzip({ level: 9 })
    const tempCompressed = resolve(__dirname, '../.temp-gallery-compressed.pck.gz')

    await pipeline(
      createReadStream(pckPath),
      createGzip({ level: 9 }),
      createWriteStream(tempCompressed),
    )

    const compressedBuffer = readFileSync(tempCompressed)
    const compressedSize = compressedBuffer.length
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

    console.log(`✓ Compressed to: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`✓ Compression ratio: ${compressionRatio}%`)

    // Upload gzipped version
    console.log(`\n🚀 Uploading compressed version to R2...`)
    const gzipKey = 'godot-gallery/Gallery.pck.gz'
    const uploadGzipCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: gzipKey,
      Body: compressedBuffer,
      ContentType: 'application/gzip',
      ContentEncoding: 'gzip',
      CacheControl: 'public, max-age=31536000',
    })

    const gzipResponse = await s3Client.send(uploadGzipCommand)
    console.log(`✓ Gzipped version uploaded!`)
    console.log(`✓ URL: ${R2_PUBLIC_URL}/${gzipKey}`)

    // Create chunk manifest
    console.log(`\n📋 Creating chunk manifest...`)
    const numChunks = Math.ceil(originalSize / CHUNK_SIZE)
    const chunks = []

    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, originalSize)
      const chunkData = pckBuffer.slice(start, end)

      chunks.push({
        index: i,
        size: chunkData.length,
        start: start,
        end: end,
      })
    }

    const manifest = {
      version: 1,
      originalSize: originalSize,
      compressedSize: compressedSize,
      compressionRatio: parseFloat(compressionRatio),
      chunkSize: CHUNK_SIZE,
      totalChunks: numChunks,
      chunks: chunks,
      originalUrl: `${R2_PUBLIC_URL}/godot-gallery/Gallery.pck`,
      compressedUrl: `${R2_PUBLIC_URL}/${gzipKey}`,
      lastUpdated: new Date().toISOString(),
    }

    console.log(
      `✓ Manifest created: ${numChunks} chunks of ${(CHUNK_SIZE / 1024 / 1024).toFixed(0)} MB`,
    )

    // Upload manifest
    console.log(`\n📤 Uploading manifest to R2...`)
    const manifestKey = 'godot-gallery/Gallery.pck.manifest.json'
    const uploadManifestCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: manifestKey,
      Body: JSON.stringify(manifest, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=3600',
    })

    await s3Client.send(uploadManifestCommand)
    console.log(`✓ Manifest uploaded!`)

    // Save manifest locally for reference
    writeFileSync(
      resolve(__dirname, '../public/godot_gallery/Gallery.pck.manifest.json'),
      JSON.stringify(manifest, null, 2),
    )

    console.log(`\n✅ Optimization complete!`)
    console.log(`\nRecommendations:`)
    console.log(
      `  1. Use Gallery.pck.gz (${(compressedSize / 1024 / 1024).toFixed(2)} MB) for browsers that support gzip`,
    )
    console.log(`  2. Keep Gallery.pck for fallback (no decompression needed)`)
    console.log(`  3. Implement chunked downloading for better reliability`)
    console.log(`  4. Use the manifest for download progress tracking`)

    // Cleanup temp file
    unlinkSync(tempCompressed)
  } catch (error) {
    console.error('❌ Operation failed:', error.message)
    if (error.Code) {
      console.error(`Error Code: ${error.Code}`)
    }
    process.exit(1)
  }
}

compressAndSplit()
