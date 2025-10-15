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
async function searchDuckDuckGo(query, maxResults = 5) {
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

    await page.setDefaultNavigationTimeout(30000)

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    console.error(`Searching: ${searchUrl}`)

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    await wait(1000) // Reduced from 1500ms

    const results = await page.evaluate(() => {
      const items = []
      const resultElements = document.querySelectorAll('.result')

      resultElements.forEach((element) => {
        const linkElement = element.querySelector('.result__a')
        const snippetElement = element.querySelector('.result__snippet')
        const urlElement = element.querySelector('.result__url')

        if (linkElement) {
          let url = linkElement.getAttribute('href') || linkElement.href

          if (url && url.startsWith('//duckduckgo.com/l/?')) {
            try {
              const urlParams = new URLSearchParams(url.split('?')[1])
              const actualUrl = urlParams.get('uddg')
              if (actualUrl) url = actualUrl
            } catch (e) {
              console.error(`Error parsing redirect URL: ${e.message}`)
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

          if (url && url.startsWith('http') && !isDocument) {
            items.push({ url, title, snippet })
          }
        }
      })

      return items
    })

    await page.close()
    page = null
    logMemoryUsage('after search')

    console.error(`Found ${results.length} results from DuckDuckGo`)
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

    await page.setDefaultNavigationTimeout(15000) // Reduced from 20s

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
    } catch (navError) {
      console.error(`Navigation to ${url} failed: ${navError.message}`)
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

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      content: cleanText.substring(0, 1500), // Reduced from 2000
      language: franc(cleanText.substring(0, 300)), // Reduced from 500
    }
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
  const englishResults = results.filter((r) => r.language === preferredLang && !r.error)
  const otherResults = results.filter((r) => r.language !== preferredLang && !r.error)

  return englishResults.length >= 3 ? englishResults : [...englishResults, ...otherResults]
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

    const searchResults = await searchDuckDuckGo(searchQuery, 5)

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

    console.error(`Returning ${links.length} links`)
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
