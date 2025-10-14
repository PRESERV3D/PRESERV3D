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
      .$$eval('li.b_algo', (items) =>
        items
          .map((item) => {
            const a = item.querySelector('h2 a')
            const title = a?.textContent?.trim() || ''
            const url = a?.href || ''
            const snippet = item.querySelector('.b_caption p')?.textContent?.trim() || ''
            return { title, url, snippet }
          })
          .filter((link) => link.url && link.url.startsWith('http')),
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
          .map((a) => {
            const title = a.querySelector('h3')?.textContent?.trim() || a.href
            const url = a.href
            // Try to find a snippet in the result container
            const container = a.closest('.g')
            const snippet = (
              container?.querySelector('.VwiC3b')?.textContent ||
              container?.querySelector('.IsZvec')?.textContent ||
              container?.querySelector('.aCOpRe')?.textContent ||
              ''
            ).trim()
            return { title, url, snippet }
          })
          .filter((link) => link.url && link.url.startsWith('http')),
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
      .$$eval('[data-testid="result"]', (items) =>
        items
          .map((item) => {
            const a = item.querySelector('a[data-testid="result-title-a"]')
            const title = a?.textContent?.trim() || ''
            const url = a?.href || ''
            const snippet = item.querySelector('.result__snippet')?.textContent?.trim() || ''
            return { title, url, snippet }
          })
          .filter((link) => link.url && link.url.startsWith('http')),
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
    let havePuppeteer = false
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
          e?.message || e,
        )
      }
      havePuppeteer = true
    } catch {
      // Try plain puppeteer, but don't throw if missing — we'll fall back to fetch+cheerio
      try {
        const mod = await import('puppeteer')
        puppeteer = mod.default || mod
        havePuppeteer = true
        console.log('Using plain puppeteer')
      } catch {
        console.log('No puppeteer available in environment; falling back to fetch+cheerio scrapers')
        puppeteer = null
        havePuppeteer = false
      }
    }

    let bing = []
    let google = []
    let ddg = []

    if (havePuppeteer && puppeteer) {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-gpu',
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

      bing = results[0].status === 'fulfilled' ? results[0].value : []
      google = results[1].status === 'fulfilled' ? results[1].value : []
      ddg = results[2].status === 'fulfilled' ? results[2].value : []
    } else {
      // Fetch + cheerio fallback scrapers
      const cheerioMod = await import('cheerio')
      const cheerio = cheerioMod.default || cheerioMod

      async function fetchHtml(url) {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
          })
          if (!res.ok) return null
          const text = await res.text()
          return text
        } catch {
          return null
        }
      }

      async function fetchScrapeBing(query) {
        const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en&setmkt=en-US`
        const html = await fetchHtml(url)
        if (!html) return []
        const $ = cheerio.load(html)
        const results = []
        $('li.b_algo').each((i, el) => {
          const a = $(el).find('h2 a')
          const title = a.text().trim()
          const href = a.attr('href') || ''
          const snippet = $(el).find('.b_caption p').text().trim() || ''
          if (href && href.startsWith('http')) results.push({ title, url: href, snippet })
        })
        return results
      }

      async function fetchScrapeGoogle(query) {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us`
        const html = await fetchHtml(url)
        if (!html) return []
        const $ = cheerio.load(html)
        const results = []
        $('div.g').each((i, el) => {
          const a = $(el).find('div.yuRUbf > a')
          const title = a.find('h3').text().trim() || a.attr('href') || ''
          const href = a.attr('href') || ''
          const snippet = (
            $(el).find('.VwiC3b').text() ||
            $(el).find('.IsZvec').text() ||
            $(el).find('.aCOpRe').text() ||
            ''
          ).trim()
          if (href && href.startsWith('http')) results.push({ title, url: href, snippet })
        })
        return results
      }

      async function fetchScrapeDuckDuckGo(query) {
        const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=us-en`
        const html = await fetchHtml(url)
        if (!html) return []
        const $ = cheerio.load(html)
        const results = []
        $('[data-testid="result"]').each((i, el) => {
          const a = $(el).find('a[data-testid="result-title-a"]')
          const title = a.text().trim() || ''
          const href = a.attr('href') || ''
          const snippet = $(el).find('.result__snippet').text().trim() || ''
          if (href && href.startsWith('http')) results.push({ title, url: href, snippet })
        })
        return results
      }

      // Run fetch-based scrapers in parallel with timeouts
      const results = await Promise.allSettled([
        withTimeout(fetchScrapeBing(query), TIMEOUT),
        withTimeout(fetchScrapeGoogle(query), TIMEOUT),
        withTimeout(fetchScrapeDuckDuckGo(query), TIMEOUT),
      ])

      bing = results[0].status === 'fulfilled' ? results[0].value : []
      google = results[1].status === 'fulfilled' ? results[1].value : []
      ddg = results[2].status === 'fulfilled' ? results[2].value : []
    }

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

    // Deduplicate by URL but keep full list for language filtering
    const uniqueLinks = Array.from(new Map(allLinks.map((link) => [link.url, link])).values())

    // Allowed language codes (ISO 639-3 from franc): English = 'eng', Tagalog = 'tgl'
    const allowedLangs = new Set(['eng', 'tgl'])

    // Detect language for a short piece of text (prefer title, fall back to URL)
    async function detectLanguage(text) {
      if (!text) return null
      const sample = String(text).trim().replace(/\s+/g, ' ').slice(0, 300)
      try {
        // Prefer the tiny franc build when available
        let francMod
        try {
          francMod = await import('franc-min')
        } catch {
          // Fallback to full franc if franc-min isn't installed
          francMod = await import('franc')
        }
        const franc = francMod.default || francMod
        const code = franc(sample)
        if (!code || code === 'und') return null
        // Map ISO codes: accept English and Tagalog
        if (code === 'eng' || code === 'tgl') return code
        return null
      } catch {
        // Heuristic fallback: look for common Tagalog/Filipino words
        const tagalogWords =
          /\b(ang|ng|sa|si|ni|mga|ako|ikaw|siya|ito|iyon|kami|tayo|kita|kayo|nila)\b/i
        const englishWords = /\b(the|and|is|are|of|to|in|for|with|on|by|this|that)\b/i
        if (tagalogWords.test(sample)) return 'tgl'
        if (englishWords.test(sample)) return 'eng'
        return null
      }
    }

    // Detect languages in parallel and filter
    const checked = await Promise.all(
      uniqueLinks.map(async (link) => {
        const lang =
          (await detectLanguage(link.snippet)) ||
          (await detectLanguage(link.title)) ||
          (await detectLanguage(link.url)) ||
          null
        return { ...link, lang }
      }),
    )

    const filtered = checked.filter((l) => allowedLangs.has(l.lang))

    // Limit to top 5 after filtering
    const outputLinks = filtered.slice(0, 5).map((l) => {
      const rest = { ...l }
      delete rest.lang
      return rest
    })

    console.log(JSON.stringify({ links: outputLinks }))
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
