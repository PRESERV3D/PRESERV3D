// Quick test script to verify web scraper dependencies
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('=== Testing Web Scraper Environment ===')
console.log('Node version:', process.version)
console.log('CWD:', process.cwd())
console.log('__dirname:', __dirname)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH)

// Check dependencies
const deps = ['puppeteer-extra', 'puppeteer', 'cheerio', 'franc']
const nodeModulesPath = resolve(__dirname, 'node_modules')

console.log('\nnode_modules path:', nodeModulesPath)
console.log('node_modules exists:', existsSync(nodeModulesPath))

console.log('\nDependency check:')
deps.forEach((dep) => {
  const depPath = resolve(nodeModulesPath, dep)
  const exists = existsSync(depPath)
  console.log(`  ${dep}: ${exists ? '✓' : '✗'} ${depPath}`)
})

// Try importing puppeteer
console.log('\nTrying to import puppeteer-extra...')
try {
  await import('puppeteer-extra')
  console.log('✓ puppeteer-extra imported successfully')
} catch (err) {
  console.error('✗ Failed to import puppeteer-extra:', err.message)
  process.exit(1)
}

// Check for Chromium executable
console.log('\nChecking for Chromium executable...')
const chromiumPaths = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
]

let foundChromium = false
chromiumPaths.forEach((path) => {
  const exists = existsSync(path)
  if (exists) {
    console.log(`✓ Found at: ${path}`)
    foundChromium = true
  }
})

if (!foundChromium) {
  console.log('✗ No system Chromium found in common paths')
  console.log('  Will attempt to use bundled Chromium')
}

console.log('\n=== Environment check complete ===')
