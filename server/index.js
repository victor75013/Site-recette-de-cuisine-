const express   = require('express');
const cors      = require('cors');
const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

// Chargement facultatif des variables .env si le fichier existe
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
}

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || `http://localhost:${PORT}`;

// Configuration CORS sécurisée
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (ex: même domaine, curl, tests locaux)
    if (!origin) return callback(null, true);
    if (origin === ALLOWED_ORIGIN || origin === `http://127.0.0.1:${PORT}` || origin === `http://localhost:${PORT}`) {
      return callback(null, true);
    }
    return callback(new Error('Origine non autorisée par la politique CORS.'));
  }
}));

app.use(express.json({ limit: '5mb' }));

// Servir exclusivement les fichiers statiques du dossier public/
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

const GT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * ATTENTION (Point 21 de sécurité & maintenabilité) :
 * L'API Google Translate via "client=gtx" est un endpoint non-officiel sans garantie de SLA.
 * En cas d'indisponibilité, le système bascule sur la traduction Gemini ou conserve le texte original.
 */
async function translateText(text, to = 'fr') {
  if (!text || !text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res  = await fetch(url, { headers: { 'User-Agent': GT_UA }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return text;
    const data = await res.json();
    return data[0]?.map(chunk => chunk[0]).join('') || text;
  } catch {
    return text;
  }
}

async function detectLanguage(text) {
  if (!text || !text.trim()) return 'fr';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fr&dt=t&q=${encodeURIComponent(text.slice(0, 100))}`;
    const res  = await fetch(url, { headers: { 'User-Agent': GT_UA }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return 'fr';
    const data = await res.json();
    return data[2] || 'fr';
  } catch {
    return 'fr';
  }
}

/**
 * Validation anti-SSRF pour bloquer les IP privées et protocoles suspects
 */
function isAllowedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    // 1. Uniquement protocoles http: et https:
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    // 2. Bloquer les IP privées, localhost et broadcast
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isBlockedHtml(html) {
  if (!html || html.length < 100) return true;
  const lower = html.toLowerCase();
  if (lower.includes('access denied') && !lower.includes('recipe')) return true;
  if (lower.includes('just a moment') || lower.includes('enable javascript and cookies to continue')) return true;
  if (lower.includes('cloudflare') && (lower.includes('ray id') || lower.includes('blocked'))) return true;
  return false;
}

// ---------- ROUTES API ----------

app.get('/api/ping', (req, res) => res.json({ ok: true, version: '2.0.0' }));
app.get('/ping', (req, res) => res.json({ ok: true, version: '2.0.0' })); // rétrocompatibilité

app.post(['/api/scrape', '/scrape'], async (req, res) => {
  const { url } = req.body;
  if (!url || !isAllowedUrl(url)) {
    return res.status(400).json({ error: 'URL invalide ou adresse non autorisée.' });
  }

  console.log(`[Scrape] ${url}`);

  // 1. Essai direct HTTP fetch
  try {
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': GT_UA,
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
    console.warn(`[Direct Fetch échoué, fallback Puppeteer] ${err.message}`);
  }

  // 2. Fallback Puppeteer pour sites JS / anti-bot
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
    await page.setUserAgent(GT_UA);
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const html = await page.content();
    const finalUrl = page.url();

    if (isBlockedHtml(html)) {
      console.error(`[Erreur scrape] Page bloquée par anti-bot : ${url}`);
      return res.status(403).json({ error: "Ce site protège son contenu contre l'accès automatique." });
    }

    console.log(`[OK Puppeteer] ${finalUrl} (${html.length} octets)`);
    return res.json({ html, finalUrl });
  } catch (err) {
    console.error(`[Erreur scrape] ${err.message}`);
    return res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Traitement par lots pour limiter la concurrence (Point 20)
async function batchProcess(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkRes = await Promise.all(chunk.map(fn));
    results.push(...chunkRes);
  }
  return results;
}

app.post(['/api/translate', '/translate'], async (req, res) => {
  const { recipe, targetLang = 'fr' } = req.body;
  if (!recipe) return res.status(400).json({ error: 'Recette manquante.' });

  try {
    const sampleText = recipe.title || recipe.description || '';
    const lang = await detectLanguage(sampleText);
    if (lang === targetLang) {
      return res.json({ recipe, translated: false, lang });
    }

    console.log(`[Translate] ${lang} → ${targetLang} : "${recipe.title}"`);
    const [title, description] = await Promise.all([
      translateText(recipe.title, targetLang),
      translateText(recipe.description, targetLang),
    ]);

    // Limitation de concurrence à 5 requêtes simultanées
    const ingredientsTranslated = await batchProcess(
      recipe.ingredients || [],
      5,
      item => translateText(item, targetLang)
    );

    const stepsTranslated = await batchProcess(
      recipe.steps || [],
      5,
      item => translateText(item, targetLang)
    );

    const translatedRecipe = {
      ...recipe,
      title,
      description,
      ingredients: ingredientsTranslated,
      steps: stepsTranslated
    };

    return res.json({ recipe: translatedRecipe, translated: true, lang, targetLang });
  } catch (err) {
    console.error(`[Erreur translate] ${err.message}`);
    return res.json({ recipe, translated: false, lang: 'unknown', error: err.message });
  }
});

// Proxy sécurisé pour l'API Gemini (Point 3)
app.post('/api/gemini', async (req, res) => {
  const { prompt, model = 'gemini-2.0-flash' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt manquant.' });

  // Récupérer la clé soit depuis la requête (header) soit depuis l'environnement serveur
  const apiKey = req.headers['x-goog-api-key'] || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'Clé API Gemini non configurée (dans .env ou paramètres).' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey // Passée dans l'en-tête, JAMAIS dans l'URL !
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Erreur Gemini: ${errText}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Fallback pour SPA vers public/index.html (Express 5)
app.get('{*path}', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application non trouvée dans public/index.html');
  }
});

// Écoute exclusivement sur 127.0.0.1 (Point 1 de sécurité)
app.listen(PORT, '127.0.0.1', () => {
  console.log('\n  🍳 Serveur Carnet de Recettes démarré !');
  console.log(`  ➜  Application & API : http://localhost:${PORT}`);
  console.log('  Ctrl+C pour arrêter.\n');

  try {
    const { exec } = require('child_process');
    if (process.platform === 'win32') exec(`start http://localhost:${PORT}`);
    else if (process.platform === 'darwin') exec(`open http://localhost:${PORT}`);
  } catch {}
});
