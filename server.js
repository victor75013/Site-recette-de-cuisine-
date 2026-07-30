const express   = require('express');
const cors      = require('cors');
const puppeteer = require('puppeteer');
const path      = require('path');

const app  = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

const GT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function translateText(text, to = 'fr') {
  if (!text?.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res  = await fetch(url, { headers: { 'User-Agent': GT_UA } });
    const data = await res.json();
    return data[0]?.map(chunk => chunk[0]).join('') || text;
  } catch { return text; }
}

async function detectLanguage(text) {
  if (!text?.trim()) return 'fr';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fr&dt=t&q=${encodeURIComponent(text.slice(0, 100))}`;
    const res  = await fetch(url, { headers: { 'User-Agent': GT_UA } });
    const data = await res.json();
    return data[2] || 'fr';
  } catch { return 'fr'; }
}

function isBlockedHtml(html) {
  if (!html || html.length < 100) return true;
  const lower = html.toLowerCase();
  if (lower.includes('access denied') && !lower.includes('recipe')) return true;
  if (lower.includes('just a moment') || lower.includes('enable javascript and cookies to continue')) return true;
  if (lower.includes('cloudflare') && (lower.includes('ray id') || lower.includes('blocked'))) return true;
  return false;
}

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) return res.status(400).json({ error: 'URL invalide.' });
  console.log(`[Scrape] ${url}`);

  // 1. Essaie d'abord un fetch HTTP direct avec headers navigateur (beaucoup plus rapide et contourne les blocages headless anti-bot de certains sites comme BBC Food)
  try {
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (fetchRes.ok) {
      const html = await fetchRes.text();
      if (!isBlockedHtml(html) && (html.includes('Recipe') || html.includes('recipe') || html.includes('ld+json') || html.length > 2000)) {
        console.log(`[OK Direct Fetch] ${url} (${html.length} octets)`);
        return res.json({ html, finalUrl: fetchRes.url || url });
      }
    }
  } catch (err) {
    console.warn(`[Fetch direct échoué, passage à Puppeteer] ${err.message}`);
  }

  // 2. Fallback vers Puppeteer pour les sites SPA / dépendant de JavaScript
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--lang=fr-FR,fr'
      ]
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));
    const html = await page.content();
    const finalUrl = page.url();

    if (isBlockedHtml(html)) {
      console.error(`[Erreur scrape] Page bloquée par anti-bot : ${url}`);
      return res.status(403).json({ error: "Ce site protège son contenu contre l'accès automatique (anti-bot / Access denied)." });
    }

    console.log(`[OK Puppeteer] ${finalUrl} (${html.length} octets)`);
    res.json({ html, finalUrl });
  } catch (err) {
    console.error(`[Erreur scrape] ${err.message}`);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.post('/translate', async (req, res) => {
  const { recipe } = req.body;
  if (!recipe) return res.status(400).json({ error: 'recipe manquante' });
  try {
    const sampleText = recipe.title || recipe.description || '';
    const lang = await detectLanguage(sampleText);
    if (lang === 'fr') { console.log(`[Translate] Déjà en français`); return res.json({ recipe, translated: false, lang }); }
    console.log(`[Translate] ${lang} → fr : "${recipe.title}"`);
    const [title, description, ...ingredientsTranslated] = await Promise.all([translateText(recipe.title), translateText(recipe.description), ...(recipe.ingredients || []).map(i => translateText(i))]);
    const steps = await Promise.all((recipe.steps || []).map(s => translateText(s)));
    const translatedRecipe = { ...recipe, title, description, ingredients: ingredientsTranslated, steps };
    console.log(`[Translate OK] "${title}"`);
    res.json({ recipe: translatedRecipe, translated: true, lang });
  } catch (err) { console.error(`[Erreur translate] ${err.message}`); res.json({ recipe, translated: false, lang: 'unknown', error: err.message }); }
});

app.get('/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n  🍳 Serveur Carnet de Recettes démarré !');
  console.log(`  ➜  API : http://localhost:${PORT}`);
});

const frontend = express();
frontend.use(express.static(path.join(__dirname, '.')));
frontend.get('{*path}', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
frontend.listen(3000, '0.0.0.0', () => {
  console.log(`  ➜  App : http://localhost:3000`);
  console.log('  Ctrl+C pour arrêter.\n');
});
