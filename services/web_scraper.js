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

/**
 * Wait utility function
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
 * Find Chrome executable in browsers directory
 */
function findChromeExecutable() {
  const browsersDir = join(__dirname, 'browsers')

  if (!existsSync(browsersDir)) {
    console.error(`Browsers directory not found at: ${browsersDir}`)
    return null
  }

  try {
    const findCmd = `find ${browsersDir} -name chrome -type f -executable 2>/dev/null | head -1`
    const chromePath = execSync(findCmd, { encoding: 'utf-8' }).trim()

    if (chromePath && existsSync(chromePath)) {
      console.error(`Found Chrome at: ${chromePath}`)
      return chromePath
    }
  } catch (err) {
    console.error(`Error finding Chrome: ${err.message}`)
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

  const chromiumPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ]

  for (const path of chromiumPaths) {
    if (existsSync(path)) {
      config.executablePath = path
      console.error(`Found system Chromium at: ${path}`)
      return config
    }
  }

  console.error('ERROR: No Chrome/Chromium executable found!')
  throw new Error('No Chrome/Chromium browser found. Please run: npm run install-chrome')
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
  try {
    console.error(`=== Starting DuckDuckGo search ===`)
    console.error(`Query: "${query}"`)

    const browser = await getBrowser()
    page = await browser.newPage()

    // Reduce memory usage by limiting page resources
    await page.setViewport({ width: 1280, height: 720 })
    await page.setRequestInterception(true)

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

    await page.setDefaultNavigationTimeout(60000) // Increased to 60s

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    console.error(`Searching: ${searchUrl}`)

    // Try navigation with retries
    let navigationSuccess = false
    let lastError = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.error(`Navigation attempt ${attempt}/3...`)
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 60000, // Increased to 60s
        })
        navigationSuccess = true
        console.error(`Navigation successful on attempt ${attempt}`)
        break
      } catch (navError) {
        lastError = navError
        console.error(`Navigation attempt ${attempt} failed: ${navError.message}`)
        if (attempt < 3) {
          await wait(2000) // Wait 2s before retry
        }
      }
    }

    if (!navigationSuccess) {
      throw new Error(`Failed to navigate to DuckDuckGo after 3 attempts: ${lastError?.message}`)
    }

    await wait(1000) // Reduced from 1500ms

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

    await page.close()
    page = null
    logMemoryUsage('after search')

    console.error(`=== Search Results Summary ===`)
    console.error(`Found ${results.length} results from DuckDuckGo`)
    console.error(`Results:`, JSON.stringify(results, null, 2))
    return results.slice(0, maxResults)
  } catch (error) {
    if (page) await page.close().catch(() => {})
    console.error(`DuckDuckGo search error: ${error.message}`)
    throw error
  }
}

/**
 * Scrape content from a URL
 */
async function scrapeContent(url) {
  let page
  try {
    console.error(`>>> Scraping URL: ${url}`)
    const browser = await getBrowser()
    page = await browser.newPage()

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
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })
    } catch (navError) {
      console.error(`Navigation to ${url} failed: ${navError.message}`)
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

    console.error(`>>> Scraped successfully: ${url}`)
    console.error(`    Title: ${result.title.substring(0, 60)}...`)
    console.error(`    Language: ${result.language}`)

    return result
  } catch (error) {
    if (page) await page.close().catch(() => {})
    console.error(`Scraping error for ${url}: ${error.message}`)
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

  for (let i = 0; i < searchResults.length; i += concurrency) {
    const batch = searchResults.slice(i, i + concurrency)
    console.error(`Scraping batch ${Math.floor(i / concurrency) + 1}: ${batch.length} URLs`)

    const batchResults = await Promise.all(batch.map((result) => scrapeContent(result.url)))

    results.push(...batchResults)

    // Give system time to free memory between batches
    if (i + concurrency < searchResults.length) {
      await wait(500)
      if (global.gc) global.gc() // Force garbage collection if available
    }

    logMemoryUsage(`after batch ${Math.floor(i / concurrency) + 1}`)
  }

  return results
}

/**
 * Filter results based on language
 */
function filterByLanguage(results, preferredLang = 'eng') {
  console.error(`=== Language Filtering ===`)
  console.error(`Total results to filter: ${results.length}`)

  const englishResults = results.filter((r) => r.language === preferredLang && !r.error)
  const otherResults = results.filter((r) => r.language !== preferredLang && !r.error)
  const errorResults = results.filter((r) => r.error)

  console.error(`English results: ${englishResults.length}`)
  console.error(`Other language results: ${otherResults.length}`)
  console.error(`Error results: ${errorResults.length}`)

  if (errorResults.length > 0) {
    console.error(
      `Errors encountered:`,
      errorResults.map((r) => ({ url: r.url, error: r.error })),
    )
  }

  const finalResults =
    englishResults.length >= 3 ? englishResults : [...englishResults, ...otherResults]
  console.error(`Returning ${finalResults.length} filtered results`)

  return finalResults
}

/**
 * Main function
 */
async function main() {
  try {
    console.error(`=== Web Scraper Starting ===`)
    console.error(`Node version: ${process.version}`)
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

    console.error(`Searching for: "${searchQuery}"`)

    let searchResults
    try {
      searchResults = await searchDuckDuckGo(searchQuery, 5)
    } catch (searchError) {
      console.error(`Search failed: ${searchError.message}`)

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
      console.error('No search results found')
      console.log(JSON.stringify({ links: [], warning: 'No search results found' }))
      return
    }

    console.error(`Found ${searchResults.length} search results, scraping content...`)

    // Use controlled concurrency instead of Promise.all
    const scrapedResults = await scrapeAllContent(searchResults, 2)

    const filteredResults = filterByLanguage(scrapedResults, 'eng')

    const links = filteredResults.map((result) => ({
      url: result.url,
      title: result.title || 'Untitled',
      description: result.description || result.content.substring(0, 150) + '...',
      language: result.language,
    }))

    console.error(`=== Final Results ===`)
    console.error(`Returning ${links.length} links`)
    console.error(`Links:`, JSON.stringify(links, null, 2))
    logMemoryUsage('before output')

    console.log(JSON.stringify({ links }))

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
    process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error(
    JSON.stringify({
      error: error.message,
      stack: error.stack,
    }),
  )
  process.exit(1)
})
