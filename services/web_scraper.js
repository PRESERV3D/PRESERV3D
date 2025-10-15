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

/**
 * Wait utility function for compatibility with newer Puppeteer versions
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
    // Find chrome executable
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
 * Get appropriate Puppeteer launch options based on environment
 */
function getPuppeteerConfig() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH

  // Base configuration
  const config = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ],
  }

  // Use system Chromium if path is provided
  if (executablePath && existsSync(executablePath)) {
    config.executablePath = executablePath
    console.error(`Using system Chromium at: ${executablePath}`)
    return config
  }

  // Try to find Chrome in local browsers directory
  const localChrome = findChromeExecutable()
  if (localChrome) {
    config.executablePath = localChrome
    console.error(`Using locally installed Chrome: ${localChrome}`)
    return config
  }

  // Try system paths
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

  // No browser found
  console.error('ERROR: No Chrome/Chromium executable found!')
  throw new Error('No Chrome/Chromium browser found. Please run: npm run install-chrome')
}

async function searchDuckDuckGo(query, maxResults = 5) {
  let browser
  try {
    console.error(`=== Starting DuckDuckGo search ===`)
    console.error(`Query: "${query}"`)
    console.error(`Environment: NODE_ENV=${process.env.NODE_ENV}, RENDER=${process.env.RENDER}`)

    const config = getPuppeteerConfig()
    console.error(
      `Launching browser with config: ${JSON.stringify({
        ...config,
        executablePath: config.executablePath || 'default (Puppeteer downloaded)',
      })}`,
    )

    browser = await puppeteer.launch(config)
    console.error(`Browser launched successfully`)

    const page = await browser.newPage()
    console.error(`New page created`)

    // Set viewport to look more like a real browser
    await page.setViewport({ width: 1920, height: 1080 })

    // Set extra headers to appear more human
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    })

    // Set a reasonable timeout
    await page.setDefaultNavigationTimeout(30000)

    // Construct DuckDuckGo search URL
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    console.error(`Searching: ${searchUrl}`)

    // Navigate with a more lenient waitUntil option
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })

    // Wait a bit for content to load
    await wait(1500)

    // Extract search results
    const results = await page.evaluate(() => {
      const items = []

      // DuckDuckGo HTML version has a simpler structure
      const resultElements = document.querySelectorAll('.result')

      resultElements.forEach((element) => {
        const linkElement = element.querySelector('.result__a')
        const snippetElement = element.querySelector('.result__snippet')
        const urlElement = element.querySelector('.result__url')

        if (linkElement) {
          // Try to get the actual URL from the data attribute or href
          let url = linkElement.getAttribute('href') || linkElement.href

          // If URL starts with //, it's a DuckDuckGo redirect - extract the actual URL
          if (url && url.startsWith('//duckduckgo.com/l/?')) {
            try {
              const urlParams = new URLSearchParams(url.split('?')[1])
              const actualUrl = urlParams.get('uddg')
              if (actualUrl) {
                url = actualUrl
              }
            } catch (e) {
              console.error(`Failed to parse DuckDuckGo redirect URL: ${e.message}`)
              if (urlElement) {
                const displayUrl = urlElement.textContent.trim()
                url = displayUrl.startsWith('http') ? displayUrl : 'https://' + displayUrl
              }
            }
          }

          // Ensure URL has protocol
          if (url && !url.startsWith('http')) {
            url = 'https://' + url
          }

          const title = linkElement.textContent.trim()
          const snippet = snippetElement ? snippetElement.textContent.trim() : ''

          // Filter out non-http links and document files
          const documentExtensions = [
            '.pdf',
            '.doc',
            '.docx',
            '.xls',
            '.xlsx',
            '.ppt',
            '.pptx',
            '.txt',
            '.rtf',
            '.odt',
            '.ods',
            '.odp',
          ]
          const urlLower = url.toLowerCase()
          const isDocument = documentExtensions.some((ext) => urlLower.includes(ext))

          if (url && url.startsWith('http') && !isDocument) {
            items.push({ url, title, snippet })
          }
        }
      })

      return items
    })

    await browser.close()

    console.error(`Found ${results.length} results from DuckDuckGo`)
    return results.slice(0, maxResults)
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {})
    }
    console.error(`DuckDuckGo search error: ${error.message}`)
    throw error
  }
}

/**
 * Scrape content from a URL
 */
async function scrapeContent(url) {
  let browser
  try {
    const config = getPuppeteerConfig()
    browser = await puppeteer.launch(config)
    const page = await browser.newPage()

    // Set viewport and headers
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    })

    await page.setDefaultNavigationTimeout(20000)

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      })
    } catch (navError) {
      // If navigation fails, try to get whatever content loaded
      console.error(`Navigation to ${url} failed: ${navError.message}`)
    }

    // Wait a bit for dynamic content
    await wait(1000)

    // Get page content
    const content = await page.content()
    await browser.close()

    // Parse with Cheerio
    const $ = cheerio.load(content)

    // Remove script, style, and other non-content tags
    $('script, style, nav, header, footer, iframe, noscript').remove()

    // Extract text content
    const bodyText = $('body').text()
    const cleanText = bodyText.replace(/\s+/g, ' ').trim()

    // Extract metadata
    const title = $('title').text() || $('h1').first().text() || ''
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      ''

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      content: cleanText.substring(0, 2000), // First 2000 chars
      language: franc(cleanText.substring(0, 500)), // Detect language
    }
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {})
    }
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
 * Filter results based on language (prioritize English)
 */
function filterByLanguage(results, preferredLang = 'eng') {
  const englishResults = results.filter((r) => r.language === preferredLang && !r.error)
  const otherResults = results.filter((r) => r.language !== preferredLang && !r.error)

  // Prefer English results, but include others if not enough English content
  return englishResults.length >= 3 ? englishResults : [...englishResults, ...otherResults]
}

/**
 * Main function
 */
async function main() {
  try {
    console.error(`=== Web Scraper Starting ===`)
    console.error(`Node version: ${process.version}`)
    console.error(`CWD: ${process.cwd()}`)
    console.error(`Script path: ${import.meta.url}`)

    // Get command line arguments
    const args = process.argv.slice(2)

    if (args.length === 0) {
      throw new Error(
        'No search query provided. Usage: node web_scraper.js <title> [author] [categories] [date]',
      )
    }

    const [title, author = '', categories = '', date = ''] = args

    // Build search query
    let searchQuery = title
    if (author) searchQuery += ` ${author}`
    if (categories) searchQuery += ` ${categories}`
    if (date) searchQuery += ` ${date}`

    console.error(`Searching for: "${searchQuery}"`)

    // Search DuckDuckGo
    const searchResults = await searchDuckDuckGo(searchQuery, 5)

    if (searchResults.length === 0) {
      console.error('No search results found, returning empty array')
      console.log(
        JSON.stringify({
          links: [],
          warning: 'No search results found',
        }),
      )
      return
    }

    console.error(`Found ${searchResults.length} search results, scraping content...`)

    // Scrape content from each result
    const scrapedResults = await Promise.all(
      searchResults.map((result) => scrapeContent(result.url)),
    )

    // Filter by language
    const filteredResults = filterByLanguage(scrapedResults, 'eng')

    // Format output
    const links = filteredResults.map((result) => ({
      url: result.url,
      title: result.title || 'Untitled',
      description: result.description || result.content.substring(0, 200) + '...',
      language: result.language,
    }))

    console.error(`Returning ${links.length} links`)
    // Output as JSON to stdout
    console.log(JSON.stringify({ links }))
  } catch (error) {
    // Output error as JSON to stderr
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
