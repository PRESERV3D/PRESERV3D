// web_scraper.js
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

const [, , title, author, categories] = process.argv
const query = `${title} ${author || ''} ${categories || ''}`.trim()

async function scrapeBing(page, query) {
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120 Safari/537.36',
  )
  await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
  })
  return await page.$$eval('li.b_algo h2 a', (anchors) =>
    anchors.map((a) => a.href).filter((h) => h.startsWith('http')),
  )
}

async function scrapeGoogle(page, query) {
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120 Safari/537.36',
  )
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
  })
  return await page.$$eval('div.yuRUbf > a', (anchors) =>
    anchors.map((a) => a.href).filter((h) => h.startsWith('http')),
  )
}

async function scrapeDuckDuckGo(page, query) {
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120 Safari/537.36',
  )
  await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
  })
  return await page.$$eval('#links .result__title a.result__a', (anchors) =>
    anchors.map((a) => a.href).filter((h) => h.startsWith('http')),
  )
}

;(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    // Create separate pages for each engine
    const [bingPage, googlePage, ddgPage] = await Promise.all([
      browser.newPage(),
      browser.newPage(),
      browser.newPage(),
    ])

    const [bing, google, ddg] = await Promise.all([
      scrapeBing(bingPage, query),
      scrapeGoogle(googlePage, query),
      scrapeDuckDuckGo(ddgPage, query),
    ])

    await browser.close()

    // Merge, deduplicate, and limit results
    const allLinks = [...bing, ...google, ...ddg]
    const uniqueLinks = Array.from(new Set(allLinks)).slice(0, 10)

    console.log(JSON.stringify({ links: uniqueLinks }))
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }))
    process.exit(1)
  }
})()
