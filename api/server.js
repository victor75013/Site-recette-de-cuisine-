const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const { scrapeUrl } = require('./services/scraper');
const { translateRecipe } = require('./services/translator');

const app  = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  try {
    const result = await scrapeUrl(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/translate', async (req, res) => {
  const { recipe } = req.body;
  if (!recipe) return res.status(400).json({ error: 'recipe manquante' });
  try {
    const result = await translateRecipe(recipe);
    res.json(result);
  } catch (err) {
    console.error(`[Erreur translate] ${err.message}`);
    res.json({ recipe, translated: false, lang: 'unknown', error: err.message });
  }
});

app.get('/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n  🍳 API Carnet de Recettes démarrée !');
  console.log(`  ➜  API : http://localhost:${PORT}`);
});

// Front-End
const frontend = express();
frontend.use(express.static(path.join(__dirname, '..')));
frontend.get('{*path}', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
frontend.listen(3000, '0.0.0.0', () => {
  console.log(`  ➜  App : http://localhost:3000`);
  console.log('  Ctrl+C pour arrêter.\n');
});
