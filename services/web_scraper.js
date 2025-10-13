// web_scraper.js
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

const [, , title, author, categories, date] = process.argv
const query = `${title} ${author || ''} ${categories || ''} ${date || ''}`.trim()

async function scrapeBing(page, query) {
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  )
  await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })

  return await page.$$eval('li.b_algo h2 a', (anchors) =>
    anchors
      .map((a) => ({
        title: a.textContent.trim(),
        url: a.href,
      }))
      .filter((link) => link.url.startsWith('http')),
  )
}

async function scrapeGoogle(page, query) {
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  )
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })

  return await page.$$eval('div.yuRUbf > a', (anchors) =>
    anchors
      .map((a) => ({
        title: a.querySelector('h3')?.textContent.trim() || a.href,
        url: a.href,
      }))
      .filter((link) => link.url.startsWith('http')),
  )
}

async function scrapeDuckDuckGo(page, query) {
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  )
  await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })

  return await page.$$eval('#links .result__title a.result__a', (anchors) =>
    anchors
      .map((a) => ({
        title: a.textContent.trim(),
        url: a.href,
      }))
      .filter((link) => link.url.startsWith('http')),
  )
}

;(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    })

    // Create separate pages for each engine
    const [bingPage, googlePage, ddgPage] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage(),
    ])

    const [bing, google, ddg] = await Promise.all([
      scrapeBing(bingPage, query).catch(() => []),
      scrapeGoogle(googlePage, query).catch(() => []),
      scrapeDuckDuckGo(ddgPage, query).catch(() => []),
    ])

    await browser.close()

    // Merge, deduplicate, and limit results
    const allLinks = [...bing, ...google, ...ddg]

    // Deduplicate by URL
    const uniqueLinks = Array.from(
      new Map(allLinks.map((link) => [link.url, link])).values(),
    ).slice(0, 5)

    console.log(JSON.stringify({ links: uniqueLinks }))
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }))
    process.exit(1)
  }
})()
