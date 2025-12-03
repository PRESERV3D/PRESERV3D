import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { franc } from 'franc'
import * as cheerio from 'cheerio'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

puppeteer.use(StealthPlugin())

// Shared browser instance to reduce memory usage
let browserInstance = null
let browserLastUsed = Date.now()
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

// Set up aggressive process timeout - kill if we exceed 170 seconds
const HARD_TIMEOUT_MS = 170000 // 170 seconds
const hardTimeoutHandle = setTimeout(() => {
  console.error('[HARD TIMEOUT] Process exceeded 170 seconds - force exiting')
  console.log(JSON.stringify({ 
    links: [], 
    error: 'Request timeout - search service took too long to respond',
    timeout: true 
  }))
  process.exit(1)
}, HARD_TIMEOUT_MS)

/**
 * Wait utility function
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Log with timestamp
 */
function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString()
  if (data) {
    console.error(`[${timestamp}] ${message}`, data)
  } else {
    console.error(`[${timestamp}] ${message}`)
  }
}

/**
 * Log memory usage
 */
function logMemoryUsage(label = '') {
  const used = process.memoryUsage()
  console.error(`Memory ${label}:`, {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
  })
}

/**
 * Find Chrome executable in browsers directory or system
 */
function findChromeExecutable() {
  // Windows Chrome paths
  const windowsPaths = [
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ]

  // Check Windows paths first
  if (process.platform === 'win32') {
    for (const path of windowsPaths) {
      if (path && existsSync(path)) {
        console.error(`Found Chrome at: ${path}`)
        return path
      }
    }
  }

  // Check browsers directory (for downloaded Chrome)
  const browsersDir = join(__dirname, 'browsers')

  if (existsSync(browsersDir)) {
    try {
      if (process.platform === 'win32') {
        // Windows: Use PowerShell to find chrome.exe
        const findCmd = `powershell -Command "Get-ChildItem -Path '${browsersDir}' -Recurse -Filter chrome.exe | Select-Object -First 1 -ExpandProperty FullName"`
        const chromePath = execSync(findCmd, { encoding: 'utf-8' }).trim()
        if (chromePath && existsSync(chromePath)) {
          console.error(`Found Chrome in browsers directory at: ${chromePath}`)
          return chromePath
        }
      } else {
        // Linux/Mac: Use find command
        const findCmd = `find ${browsersDir} -name chrome -type f -executable 2>/dev/null | head -1`
        const chromePath = execSync(findCmd, { encoding: 'utf-8' }).trim()
        if (chromePath && existsSync(chromePath)) {
          console.error(`Found Chrome in browsers directory at: ${chromePath}`)
          return chromePath
        }
      }
    } catch (err) {
      console.error(`Error finding Chrome in browsers directory: ${err.message}`)
    }
  }

  return null
}

/**
 * Get appropriate Puppeteer launch options
 */
function getPuppeteerConfig() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH

  const config = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--disable-default-apps',
      '--mute-audio',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Critical for low memory environments
      '--window-size=1280x720', // Reduced from 1920x1080
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
  }

  if (executablePath && existsSync(executablePath)) {
    config.executablePath = executablePath
    console.error(`Using system Chromium at: ${executablePath}`)
    return config
  }

  const localChrome = findChromeExecutable()
  if (localChrome) {
    config.executablePath = localChrome
    console.error(`Using locally installed Chrome: ${localChrome}`)
    return config
  }

  // Linux/Mac system paths
  const chromiumPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ]

  if (process.platform !== 'win32') {
    for (const path of chromiumPaths) {
      if (existsSync(path)) {
        config.executablePath = path
        console.error(`Found system Chromium at: ${path}`)
        return config
      }
    }
  }

  console.error('ERROR: No Chrome/Chromium executable found!')
  console.error(
    'Please install Google Chrome or set PUPPETEER_EXECUTABLE_PATH environment variable',
  )
  throw new Error(
    'No Chrome/Chromium browser found. Please install Google Chrome or set PUPPETEER_EXECUTABLE_PATH',
  )
}

/**
 * Get or create shared browser instance
 */
async function getBrowser() {
  // Close browser if it's been idle too long
  if (browserInstance && Date.now() - browserLastUsed > BROWSER_IDLE_TIMEOUT) {
    console.error('Closing idle browser instance')
    await browserInstance.close().catch(() => {})
    browserInstance = null
  }

  // Create new browser if needed
  if (!browserInstance) {
    console.error('Creating new browser instance')
    logMemoryUsage('before browser launch')

    const config = getPuppeteerConfig()
    browserInstance = await puppeteer.launch(config)

    logMemoryUsage('after browser launch')

    // Handle unexpected closures
    browserInstance.on('disconnected', () => {
      console.error('Browser disconnected')
      browserInstance = null
    })
  }

  browserLastUsed = Date.now()
  return browserInstance
}

/**
 * Search DuckDuckGo for related links
 */
async function searchDuckDuckGo(query, maxResults = 3) {
  let page
  const startTime = Date.now()
  try {
    logWithTimestamp('=== Starting DuckDuckGo search ===')
    logWithTimestamp(`Query: "${query}"`)
    logWithTimestamp('Getting browser instance...')

    const browser = await getBrowser()
    logWithTimestamp(`Browser ready (took ${Date.now() - startTime}ms)`)
    page = await browser.newPage()
    logWithTimestamp('New page created, configuring...')

    // Reduce memory usage by limiting page resources
    await page.setViewport({ width: 1280, height: 720 })
    await page.setRequestInterception(true)
    logWithTimestamp('Request interception enabled')

    // Block unnecessary resources to save memory
    page.on('request', (request) => {
      const resourceType = request.resourceType()
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort()
      } else {
        request.continue()
      }
    })

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
    })

    await page.setDefaultNavigationTimeout(30000) // 30 seconds

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    logWithTimestamp(`Navigating to: ${searchUrl}`)

    // Try navigation with retries
    let navigationSuccess = false
    let lastError = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        logWithTimestamp(`Navigation attempt ${attempt}/3...`)
        const navStartTime = Date.now()
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000, // 30 seconds per attempt
        })
        navigationSuccess = true
        logWithTimestamp(
          `✓ Navigation successful on attempt ${attempt} (took ${Date.now() - navStartTime}ms)`,
        )
        break
      } catch (navError) {
        lastError = navError
        logWithTimestamp(`✗ Navigation attempt ${attempt} failed: ${navError.message}`)
        if (attempt < 3) {
          logWithTimestamp(`Waiting 2s before retry...`)
          await wait(2000) // Wait 2s before retry
        }
      }
    }

    if (!navigationSuccess) {
      throw new Error(`Failed to navigate to DuckDuckGo after 3 attempts: ${lastError?.message}`)
    }

    // Check if we got blocked by checking page content
    logWithTimestamp('Checking if page loaded successfully...')
    const pageContent = await page.content()
    
    if (pageContent.includes('captcha') || pageContent.includes('CAPTCHA')) {
      logWithTimestamp('⚠ CAPTCHA detected - DuckDuckGo is blocking automated access')
      throw new Error('DuckDuckGo is blocking automated access with CAPTCHA')
    }
    
    if (pageContent.includes('Access Denied') || pageContent.includes('403')) {
      logWithTimestamp('⚠ Access denied - DuckDuckGo is blocking this request')
      throw new Error('DuckDuckGo blocked access to search results')
    }

    logWithTimestamp('✓ Page appears to be valid search results')
    logWithTimestamp('Waiting for page to settle (1s)...')
    await wait(1000) // Reduced from 1500ms

    logWithTimestamp('Extracting search results from page...')
    const evalStartTime = Date.now()
    const results = await page.evaluate(() => {
      const items = []
      const resultElements = document.querySelectorAll('.result')
      console.log(`[Page Evaluate] Found ${resultElements.length} result elements`)

      resultElements.forEach((element, index) => {
        const linkElement = element.querySelector('.result__a')
        const snippetElement = element.querySelector('.result__snippet')
        const urlElement = element.querySelector('.result__url')
        console.log(
          `[Result ${index + 1}] linkElement:`,
          !!linkElement,
          'snippetElement:',
          !!snippetElement,
          'urlElement:',
          !!urlElement,
        )

        if (linkElement) {
          let url = linkElement.getAttribute('href') || linkElement.href
          console.log(`[Result ${index + 1}] Initial URL:`, url)

          if (url && url.startsWith('//duckduckgo.com/l/?')) {
            console.log(`[Result ${index + 1}] Detected DuckDuckGo redirect URL`)
            try {
              const urlParams = new URLSearchParams(url.split('?')[1])
              const actualUrl = urlParams.get('uddg')
              console.log(`[Result ${index + 1}] Extracted actual URL:`, actualUrl)
              if (actualUrl) url = actualUrl
            } catch (e) {
              console.log(`[Result ${index + 1}] Error parsing redirect URL: ${e.message}`)
              if (urlElement) {
                const displayUrl = urlElement.textContent.trim()
                url = displayUrl.startsWith('http') ? displayUrl : 'https://' + displayUrl
              }
            }
          }

          if (url && !url.startsWith('http')) {
            url = 'https://' + url
          }

          const title = linkElement.textContent.trim()
          const snippet = snippetElement ? snippetElement.textContent.trim() : ''

          const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
          const urlLower = url.toLowerCase()
          const isDocument = documentExtensions.some((ext) => urlLower.includes(ext))
          console.log(
            `[Result ${index + 1}] URL:`,
            url,
            '| isDocument:',
            isDocument,
            '| title:',
            title.substring(0, 50),
          )

          if (url && url.startsWith('http') && !isDocument) {
            console.log(`[Result ${index + 1}] ✓ Added to results`)
            items.push({ url, title, snippet })
          } else {
            console.log(
              `[Result ${index + 1}] ✗ Filtered out - url:`,
              !!url,
              'startsWithHttp:',
              url?.startsWith('http'),
              'isDocument:',
              isDocument,
            )
          }
        }
      })

      console.log(`[Page Evaluate] Total items collected: ${items.length}`)
      return items
    })

    logWithTimestamp(`Page evaluation complete (took ${Date.now() - evalStartTime}ms)`)

    await page.close()
    page = null
    logMemoryUsage('after search')

    logWithTimestamp('=== Search Results Summary ===')
    logWithTimestamp(`Found ${results.length} results from DuckDuckGo`)
    logWithTimestamp(`Total search time: ${Date.now() - startTime}ms`)
    console.error(`Results:`, JSON.stringify(results, null, 2))
    return results.slice(0, maxResults)
  } catch (error) {
    if (page) await page.close().catch(() => {})
    logWithTimestamp(`✗ DuckDuckGo search error: ${error.message}`)
    logWithTimestamp(`Error stack: ${error.stack}`)
    throw error
  }
}

/**
 * Scrape content from a URL
 */
async function scrapeContent(url) {
  let page
  const startTime = Date.now()
  try {
    logWithTimestamp(`>>> Scraping URL: ${url}`)
    const browser = await getBrowser()
    page = await browser.newPage()
    logWithTimestamp(`Page created for ${url}`)

    await page.setViewport({ width: 1280, height: 720 })
    await page.setRequestInterception(true)

    // Block images and other heavy resources
    page.on('request', (request) => {
      const resourceType = request.resourceType()
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort()
      } else {
        request.continue()
      }
    })

    await page.setDefaultNavigationTimeout(20000) // Increased to 20s

    try {
      logWithTimestamp(`Navigating to content page: ${url}`)
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })
      logWithTimestamp(`✓ Content page loaded: ${url}`)
    } catch (navError) {
      logWithTimestamp(`✗ Navigation to ${url} failed: ${navError.message}`)
      // Continue even if navigation fails - we'll return partial data
    }

    await wait(500) // Reduced from 1000ms

    const content = await page.content()
    await page.close()
    page = null

    const $ = cheerio.load(content)
    $('script, style, nav, header, footer, iframe, noscript').remove()

    const bodyText = $('body').text()
    const cleanText = bodyText.replace(/\s+/g, ' ').trim()

    const title = $('title').text() || $('h1').first().text() || ''
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''

    const result = {
      url,
      title: title.trim(),
      description: description.trim(),
      content: cleanText.substring(0, 1500),
      language: franc(cleanText.substring(0, 300)),
    }

    logWithTimestamp(`>>> ✓ Scraped successfully: ${url} (took ${Date.now() - startTime}ms)`)
    logWithTimestamp(`    Title: ${result.title.substring(0, 60)}...`)
    logWithTimestamp(`    Language: ${result.language}`)

    return result
  } catch (error) {
    if (page) await page.close().catch(() => {})
    logWithTimestamp(
      `✗ Scraping error for ${url}: ${error.message} (took ${Date.now() - startTime}ms)`,
    )
    return {
      url,
      error: error.message,
      title: '',
      description: '',
      content: '',
      language: 'und',
    }
  }
}

/**
 * Scrape content with concurrency control
 */
async function scrapeAllContent(searchResults, concurrency = 2) {
  const results = []
  const totalBatches = Math.ceil(searchResults.length / concurrency)

  logWithTimestamp(
    `=== Starting content scraping: ${searchResults.length} URLs in ${totalBatches} batches ===`,
  )

  for (let i = 0; i < searchResults.length; i += concurrency) {
    const batch = searchResults.slice(i, i + concurrency)
    const batchNum = Math.floor(i / concurrency) + 1
    logWithTimestamp(`Scraping batch ${batchNum}/${totalBatches}: ${batch.length} URLs`)
    const batchStartTime = Date.now()

    const batchResults = await Promise.all(batch.map((result) => scrapeContent(result.url)))

    results.push(...batchResults)
    logWithTimestamp(
      `✓ Batch ${batchNum}/${totalBatches} complete (took ${Date.now() - batchStartTime}ms)`,
    )

    // Give system time to free memory between batches
    if (i + concurrency < searchResults.length) {
      logWithTimestamp('Waiting 500ms between batches...')
      await wait(500)
      if (global.gc) {
        logWithTimestamp('Running garbage collection...')
        global.gc()
      }
    }

    logMemoryUsage(`after batch ${batchNum}`)
  }

  logWithTimestamp(`=== Content scraping complete: ${results.length} results ===`)
  return results
}

/**
 * Filter results based on language
 */
function filterByLanguage(results, preferredLang = 'eng') {
  logWithTimestamp('=== Language Filtering ===')
  logWithTimestamp(`Total results to filter: ${results.length}`)

  const englishResults = results.filter((r) => r.language === preferredLang && !r.error)
  const otherResults = results.filter((r) => r.language !== preferredLang && !r.error)
  const errorResults = results.filter((r) => r.error)

  logWithTimestamp(`English results: ${englishResults.length}`)
  logWithTimestamp(`Other language results: ${otherResults.length}`)
  logWithTimestamp(`Error results: ${errorResults.length}`)

  if (errorResults.length > 0) {
    logWithTimestamp('Errors encountered:')
    errorResults.forEach((r) => {
      logWithTimestamp(`  - ${r.url}: ${r.error}`)
    })
  }

  const finalResults =
    englishResults.length >= 3 ? englishResults : [...englishResults, ...otherResults]
  logWithTimestamp(`Returning ${finalResults.length} filtered results`)

  return finalResults
}

/**
 * Main function
 */
async function main() {
  const totalStartTime = Date.now()
  try {
    logWithTimestamp('=== Web Scraper Starting ===')
    logWithTimestamp(`Node version: ${process.version}`)
    logWithTimestamp(`Platform: ${process.platform}`)
    logMemoryUsage('startup')

    const args = process.argv.slice(2)

    if (args.length === 0) {
      throw new Error(
        'No search query provided. Usage: node web_scraper.js <title> [author] [categories] [date]',
      )
    }

    const [title, author = '', categories = '', date = ''] = args

    let searchQuery = title
    if (author) searchQuery += ` ${author}`
    if (categories) searchQuery += ` ${categories}`
    if (date) searchQuery += ` ${date}`

    logWithTimestamp('=== Search Parameters ===')
    logWithTimestamp(`Title: ${title}`)
    logWithTimestamp(`Author: ${author || '(none)'}`)
    logWithTimestamp(`Categories: ${categories || '(none)'}`)
    logWithTimestamp(`Date: ${date || '(none)'}`)
    logWithTimestamp(`Full query: "${searchQuery}"`)

    let searchResults
    try {
      logWithTimestamp('=== PHASE 1: Searching DuckDuckGo ===')
      searchResults = await searchDuckDuckGo(searchQuery, 5)
      logWithTimestamp(`✓ Phase 1 complete: Found ${searchResults.length} results`)
    } catch (searchError) {
      logWithTimestamp(`✗ Phase 1 failed: ${searchError.message}`)

      // Return error with helpful message
      const errorResponse = {
        links: [],
        error: `Search service unavailable: ${searchError.message}`,
        suggestion:
          'The search service may be experiencing connectivity issues. Please try again in a few moments.',
      }

      console.log(JSON.stringify(errorResponse))
      return
    }

    if (searchResults.length === 0) {
      logWithTimestamp('No search results found')
      console.log(JSON.stringify({ links: [], warning: 'No search results found' }))
      return
    }

    logWithTimestamp(`Found ${searchResults.length} search results`)
    logWithTimestamp('=== PHASE 2: Scraping content from URLs ===')

    // Use controlled concurrency instead of Promise.all
    const scrapedResults = await scrapeAllContent(searchResults, 2)
    logWithTimestamp(`✓ Phase 2 complete: Scraped ${scrapedResults.length} pages`)

    logWithTimestamp('=== PHASE 3: Filtering by language ===')
    const filteredResults = filterByLanguage(scrapedResults, 'eng')
    logWithTimestamp(`✓ Phase 3 complete: ${filteredResults.length} results after filtering`)

    const links = filteredResults.map((result) => ({
      url: result.url,
      title: result.title || 'Untitled',
      description: result.description || result.content.substring(0, 150) + '...',
      language: result.language,
    }))

    logWithTimestamp('=== Final Results ===')
    logWithTimestamp(`Returning ${links.length} links`)
    logWithTimestamp(`Total execution time: ${Date.now() - totalStartTime}ms`)
    logWithTimestamp('Links:')
    links.forEach((link, idx) => {
      logWithTimestamp(`  ${idx + 1}. ${link.title} - ${link.url}`)
    })
    logMemoryUsage('before output')

    logWithTimestamp('=== OUTPUTTING RESULTS TO STDOUT ===')
    console.log(JSON.stringify({ links }))
    logWithTimestamp('✓ Results output complete')

    // Clear the hard timeout since we finished successfully
    clearTimeout(hardTimeoutHandle)
    
    // Don't close browser - keep it alive for next request
  } catch (error) {
    console.error(`=== Error in main function ===`)
    console.error(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        name: error.name,
      }),
    )
    
    // Clear hard timeout before exiting
    clearTimeout(hardTimeoutHandle)
    process.exit(1)
  }
}

// Global timeout wrapper to prevent hanging indefinitely
async function runWithTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ])
}

// Run the script with global timeout
runWithTimeout(main(), 165000) // 165 seconds (leaves 15s buffer before hard timeout)
  .then(() => {
    logWithTimestamp('=== Script completed successfully ===')
    clearTimeout(hardTimeoutHandle)
    process.exit(0)
  })
  .catch((error) => {
    console.error(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
    )
    clearTimeout(hardTimeoutHandle)
    process.exit(1)
  })
