// web_scraper.js
let puppeteer
let StealthPlugin

process.stdout.setDefaultEncoding('utf8')

// We'll dynamically import the modules in the async main block below.

const [, , title, author, categories, date] = process.argv
const query = `${title} ${author || ''} ${categories || ''} ${date || ''}`.trim()

const TIMEOUT = 20000 // 20 seconds per engine

// Add a timeout wrapper
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ])
}

async function scrapeBing(page, query) {
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )

    // Add language parameters for English results
    await page.goto(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en&setmkt=en-US`,
      {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUT,
      },
    )

    await page.waitForSelector('li.b_algo', { timeout: 3000 }).catch(() => null)

    return await page
      .$$eval('li.b_algo h2 a', (anchors) =>
        anchors
          .map((a) => ({
            title: a.textContent.trim(),
            url: a.href,
          }))
          .filter((link) => link.url.startsWith('http')),
      )
      .catch(() => [])
  } catch (err) {
    console.error('Bing scrape error:', err.message)
    return []
  }
}

async function scrapeGoogle(page, query) {
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )

    // Add language and region parameters
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT,
    })

    await page.waitForSelector('div.g', { timeout: 3000 }).catch(() => null)

    return await page
      .$$eval('div.yuRUbf > a', (anchors) =>
        anchors
          .map((a) => ({
            title: a.querySelector('h3')?.textContent.trim() || a.href,
            url: a.href,
          }))
          .filter((link) => link.url.startsWith('http')),
      )
      .catch(() => [])
  } catch (err) {
    console.error('Google scrape error:', err.message)
    return []
  }
}

async function scrapeDuckDuckGo(page, query) {
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )

    // Add language parameter
    await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=us-en`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT,
    })

    await page.waitForSelector('[data-testid="result"]', { timeout: 3000 }).catch(() => null)

    return await page
      .$$eval('[data-testid="result"] a[data-testid="result-title-a"]', (anchors) =>
        anchors
          .map((a) => ({
            title: a.textContent.trim(),
            url: a.href,
          }))
          .filter((link) => link.url.startsWith('http')),
      )
      .catch(() => [])
  } catch (err) {
    console.error('DuckDuckGo scrape error:', err.message)
    return []
  }
}

;(async () => {
  let browser
  try {
    // Dynamic imports: prefer puppeteer-extra + stealth when available
    try {
      const mod = await import('puppeteer-extra')
      puppeteer = mod.default || mod
      try {
        const stealthMod = await import('puppeteer-extra-plugin-stealth')
        StealthPlugin = stealthMod.default || stealthMod
        puppeteer.use(StealthPlugin())
        console.log('Using puppeteer-extra with stealth plugin')
      } catch (e) {
        console.log(
          'puppeteer-extra available but stealth plugin not found; continuing without stealth:',
          e.message,
        )
      }
    } catch (err) {
      // Fallback to plain puppeteer
      console.log('puppeteer-extra not available, falling back to puppeteer:', err.message)
      const mod = await import('puppeteer')
      puppeteer = mod.default || mod
    }

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-gpu', // Add this
      ],
    })

    const [bingPage, googlePage, ddgPage] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage(),
    ])

    const extraHeaders = {
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Charset': 'utf-8',
    }

    await Promise.all([
      bingPage.setExtraHTTPHeaders(extraHeaders),
      googlePage.setExtraHTTPHeaders(extraHeaders),
      ddgPage.setExtraHTTPHeaders(extraHeaders),
    ])

    // Run all scrapers in parallel with individual timeouts
    const results = await Promise.allSettled([
      withTimeout(scrapeBing(bingPage, query), TIMEOUT),
      withTimeout(scrapeGoogle(googlePage, query), TIMEOUT),
      withTimeout(scrapeDuckDuckGo(ddgPage, query), TIMEOUT),
    ])

    await browser.close()

    const bing = results[0].status === 'fulfilled' ? results[0].value : []
    const google = results[1].status === 'fulfilled' ? results[1].value : []
    const ddg = results[2].status === 'fulfilled' ? results[2].value : []

    const allLinks = [...bing, ...google, ...ddg]

    if (allLinks.length === 0) {
      console.log(
        JSON.stringify({
          links: [],
          warning: 'No results found. Search engines may be blocking requests.',
        }),
      )
      process.exit(0)
    }

    const uniqueLinks = Array.from(
      new Map(allLinks.map((link) => [link.url, link])).values(),
    ).slice(0, 5)

    console.log(JSON.stringify({ links: uniqueLinks }))
  } catch (err) {
    console.error(
      JSON.stringify({
        error: err.message,
        stack: err.stack,
      }),
    )
    process.exit(1)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
})()
