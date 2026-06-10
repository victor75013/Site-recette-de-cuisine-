const puppeteer = require('puppeteer');

async function scrapeUrl(url) {
  if (!url || !url.startsWith('http')) {
    throw new Error('URL invalide.');
  }
  console.log(`[Scrape] ${url}`);
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => { 
      Object.defineProperty(navigator, 'webdriver', { get: () => false }); 
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));
    
    const html = await page.content();
    const finalUrl = page.url();
    
    console.log(`[OK] ${finalUrl}`);
    return { html, finalUrl };
  } catch (err) { 
    console.error(`[Erreur scrape] ${err.message}`); 
    throw err;
  } finally { 
    if (browser) await browser.close(); 
  }
}

module.exports = { scrapeUrl };
