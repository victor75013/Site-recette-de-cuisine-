const puppeteer = require('puppeteer');
const http = require('http');
const handler = require('serve-handler');

// Démarrer un serveur statique
const server = http.createServer((request, response) => {
  return handler(request, response, { public: './' });
});

server.listen(8080, async () => {
  console.log('Serveur démarré sur http://localhost:8080');
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    let hasErrors = false;
    
    // Capturer les erreurs JS de la page
    page.on('pageerror', err => {
      console.error('Page Error:', err.message);
      hasErrors = true;
    });
    
    // Capturer les erreurs de requêtes (ex: 404 pour un module introuvable)
    page.on('response', response => {
      if (!response.ok() && response.status() !== 200) {
        console.error('Erreur réseau:', response.status(), response.url());
        hasErrors = true;
      }
    });

    // Capturer les erreurs de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console Error:', msg.text());
        hasErrors = true;
      }
    });

    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    
    await browser.close();
    server.close();
    
    if (hasErrors) {
      console.log('Test échoué : des erreurs ont été détectées.');
      process.exit(1);
    } else {
      console.log('Test réussi : aucune erreur JS détectée au chargement.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Erreur Puppeteer:', err);
    server.close();
    process.exit(1);
  }
});
