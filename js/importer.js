/* importer.js — Import automatique de recettes */

const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
];
const LOCAL_SERVER = 'http://localhost:3001';
let localServerAvailable = false;

async function checkLocalServer() {
  try {
    const res = await fetch(`${LOCAL_SERVER}/ping`, { signal: AbortSignal.timeout(1500) });
    const json = await res.json();
    localServerAvailable = json.ok === true;
  } catch { localServerAvailable = false; }
  return localServerAvailable;
}

async function fetchViaLocalServer(targetUrl) {
  const res = await fetch(`${LOCAL_SERVER}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(err.error || `Erreur ${res.status}`); }
  const data = await res.json();
  return { text: data.html || '', finalUrl: data.finalUrl || targetUrl };
}

async function fetchViaProxy(targetUrl) {
  let lastError;
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(targetUrl), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      if (proxy.includes('allorigins')) { const json = await res.json(); return { text: json.contents || '', finalUrl: json.status?.url || targetUrl }; }
      return { text: await res.text(), finalUrl: targetUrl };
    } catch (e) { lastError = e; }
  }
  throw new Error('Tous les proxies ont échoué.');
}

async function smartFetch(targetUrl) {
  if (localServerAvailable) { try { return await fetchViaLocalServer(targetUrl); } catch (err) { console.warn('[Serveur local] échec:', err.message); } }
  return fetchViaProxy(targetUrl);
}

async function translateRecipeIfNeeded(recipe, statusEl) {
  if (localServerAvailable) {
    try {
      if (statusEl) statusEl.innerHTML = statusHtml('loading', '🌐 Traduction en français…');
      const res = await fetch(`${LOCAL_SERVER}/translate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipe }), signal: AbortSignal.timeout(30000) });
      const data = await res.json();
      return data.recipe || recipe;
    } catch (err) { console.warn('[Translate] Serveur local échoué:', err.message); }
  }
  const settings = getSettings();
  if (settings.geminiApiKey) {
    try {
      if (statusEl) statusEl.innerHTML = statusHtml('loading', '🤖 Traduction via Gemini…');
      return await translateWithGemini(recipe, settings.geminiApiKey);
    } catch (err) { console.warn('[Translate] Gemini échoué:', err.message); }
  }
  return recipe;
}

async function translateWithGemini(recipe, apiKey) {
  const prompt = `Traduis cette recette en français. Retourne UNIQUEMENT le même objet JSON avec les champs traduits (title, description, ingredients, steps).\n${JSON.stringify({ title: recipe.title, description: recipe.description, ingredients: recipe.ingredients, steps: recipe.steps })}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }) });
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return { ...recipe, ...parsed };
}

async function renderImportPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1 class="form-page-title">🔗 Importer une recette</h1>
    <div class="import-container">
      <div id="server-badge" style="margin-bottom:20px;"><span style="font-size:0.82rem;color:var(--text-dim);">⏳ Vérification du serveur…</span></div>
      <div class="import-card" id="import-url-card">
        <div class="import-card-header">
          <span class="import-card-icon">🌐</span>
          <div>
            <div class="import-card-title">Depuis un site web</div>
            <div class="import-card-sub" id="url-card-sub">Marmiton, 750g, AllRecipes, BBC Food…</div>
          </div>
        </div>
        <div class="import-row">
          <input class="form-input" type="url" id="url-input" placeholder="https://www.marmiton.org/recettes/..." />
          <button class="btn btn--primary" id="btn-import-url">Importer</button>
        </div>
        <div id="url-status" style="display:none"></div>
        <div id="url-preview" style="display:none"></div>
      </div>
      <div class="import-card" id="import-tiktok-card">
        <div class="import-card-header">
          <span class="import-card-icon">🎵</span>
          <div>
            <div class="import-card-title">Depuis TikTok</div>
            <div class="import-card-sub">Extrait la recette de la description de la vidéo</div>
          </div>
        </div>
        <div class="import-row">
          <input class="form-input" type="url" id="tiktok-input" placeholder="https://www.tiktok.com/@user/video/..." />
          <button class="btn btn--primary" id="btn-import-tiktok">Importer</button>
        </div>
        <div id="tiktok-status" style="display:none"></div>
        <div id="tiktok-preview" style="display:none"></div>
      </div>
    </div>
  `;

  const serverOk = await checkLocalServer();
  const badgeEl = document.getElementById('server-badge');
  const subEl = document.getElementById('url-card-sub');
  if (badgeEl) {
    badgeEl.innerHTML = serverOk
      ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:20px;font-size:0.78rem;color:#22c55e;font-weight:600;"><span style="width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;"></span>Serveur Puppeteer actif — tous les sites supportés ✅</span>`
      : `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:20px;font-size:0.78rem;color:#fbbf24;font-weight:600;"><span style="width:7px;height:7px;border-radius:50%;background:#fbbf24;display:inline-block;"></span>Mode proxy — lancez <em>Démarrer le serveur.bat</em> pour Marmiton</span>`;
  }
  if (subEl) subEl.textContent = serverOk ? 'Marmiton, 750g, AllRecipes, BBC Food et tous les autres ✅' : 'AllRecipes, BBC Food, SimplyRecipes… (Marmiton nécessite le serveur)';

  document.getElementById('btn-import-url').addEventListener('click', () => { const url = document.getElementById('url-input').value.trim(); if (!url) { showToast('Veuillez entrer une URL.', 'error'); return; } importFromUrl(url); });
  document.getElementById('url-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('btn-import-url').click(); });
  document.getElementById('btn-import-tiktok').addEventListener('click', () => { const url = document.getElementById('tiktok-input').value.trim(); if (!url) { showToast('Veuillez entrer une URL TikTok.', 'error'); return; } importFromTikTok(url); });
  document.getElementById('tiktok-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('btn-import-tiktok').click(); });
}

const BLOCKED_SITES = ['marmiton.org', '750g.com', 'cuisineactuelle.fr'];

async function importFromUrl(url) {
  const statusEl = document.getElementById('url-status');
  const previewEl = document.getElementById('url-preview');
  previewEl.style.display = 'none';
  statusEl.style.display = 'block';
  const hostname = new URL(url).hostname.replace('www.', '');
  const method = localServerAvailable ? '🖥️ Serveur Puppeteer' : '🌐 Proxy';
  statusEl.innerHTML = statusHtml('loading', `⏳ Récupération via ${method}…`);
  try {
    const { text: htmlString, finalUrl } = await smartFetch(url);
    if (!htmlString) throw new Error('Contenu vide reçu.');
    if (!localServerAvailable) {
      const blockSignals = detectBlockedPage(htmlString);
      if (blockSignals || (BLOCKED_SITES.some(s => hostname.includes(s)) && isErrorTitle(new DOMParser().parseFromString(htmlString, 'text/html').title))) {
        showBlockedSiteMessage(url, hostname, previewEl, statusEl); return;
      }
    }
    statusEl.innerHTML = statusHtml('loading', '🔍 Parsing des données…');
    const recipe = parseRecipeFromHtml(htmlString, finalUrl || url);
    if (!recipe || !recipe.title || isErrorTitle(recipe.title)) {
      if (BLOCKED_SITES.some(s => hostname.includes(s)) && !localServerAvailable) { showBlockedSiteMessage(url, hostname, previewEl, statusEl); }
      else throw new Error('Impossible d\'extraire une recette. Format non standard.');
      return;
    }
    let translatedRecipe = await translateRecipeIfNeeded(recipe, statusEl);
    statusEl.innerHTML = statusHtml('success', `✅ Recette importée !`);
    showImportPreview(translatedRecipe, previewEl, 'url');
  } catch (err) { console.error('[Import URL]', err); statusEl.innerHTML = statusHtml('error', `❌ ${err.message}`); }
}

function detectBlockedPage(html) {
  const lower = html.slice(0, 5000).toLowerCase();
  return (lower.includes('cloudflare') && (lower.includes('blocked') || lower.includes('ray id')) || lower.includes('access denied') || lower.includes('just a moment') || lower.includes('captcha'));
}

function isErrorTitle(title) {
  return /^(403|404|429|500|502|503|access denied|forbidden|error|just a moment)/i.test((title || '').trim());
}

function showBlockedSiteMessage(url, hostname, previewEl, statusEl) {
  statusEl.innerHTML = statusHtml('error', `⛔ <strong>${hostname}</strong> bloque l'accès automatique (Cloudflare / anti-bot).`);
  previewEl.style.display = 'block';
  previewEl.innerHTML = `<div class="import-preview"><div class="import-preview-title">💡 Comment importer depuis ce site ?</div><p style="font-size:0.87rem;color:var(--text-muted);margin-bottom:14px;">Ce site protège ses pages contre les robots.</p><ol style="font-size:0.87rem;padding-left:20px;margin-bottom:16px;line-height:2;"><li>Ouvrez la recette dans votre navigateur</li><li>Copiez le titre, les ingrédients et les étapes</li><li>Collez-les dans le formulaire manuel</li></ol><button class="btn btn--primary" id="btn-open-manual-url">✏️ Créer manuellement</button></div>`;
  document.getElementById('btn-open-manual-url').addEventListener('click', () => { renderAddEditForm(null, { sourceUrl: url, category: 'Autres' }); setActiveTab('add'); });
}

function parseRecipeFromHtml(html, url) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      let data = JSON.parse(script.textContent);
      if (data['@graph']) data = data['@graph'];
      if (Array.isArray(data)) { const found = data.find(d => d['@type'] === 'Recipe' || (Array.isArray(d['@type']) && d['@type'].includes('Recipe'))); if (found) return extractFromJsonLd(found, url); }
      if (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) return extractFromJsonLd(data, url);
    } catch {}
  }
  const recipeEl = doc.querySelector('[itemtype*="schema.org/Recipe"]');
  if (recipeEl) return extractFromMicrodata(recipeEl, doc, url);
  return extractFromOpengraph(doc, url);
}

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return str || '';
  const ta = document.createElement('textarea');
  let result = str;
  for (let i = 0; i < 4; i++) { ta.innerHTML = result; const decoded = ta.value; if (decoded === result) break; result = decoded; }
  return result.trim();
}

function extractFromJsonLd(data, url) {
  const getText = (val) => { if (!val) return ''; if (typeof val === 'string') return decodeHtmlEntities(val.replace(/<[^>]+>/g, '').trim()); if (Array.isArray(val)) return val.map(getText).join(', '); if (typeof val === 'object') return decodeHtmlEntities((val['@value'] || val.text || '').replace(/<[^>]+>/g, '').trim()); return String(val); };
  const getList = (val) => { if (!val) return []; return (Array.isArray(val) ? val : [val]).map(getText).filter(Boolean); };
  const getSteps = (val) => { if (!val) return []; return (Array.isArray(val) ? val : [val]).map(item => { if (typeof item === 'string') return decodeHtmlEntities(item.replace(/<[^>]+>/g, '').trim()); if (item['@type'] === 'HowToStep') return getText(item.text || item.name); return getText(item.text || item.name || item); }).filter(Boolean); };
  const getTime = (iso) => { if (!iso) return 0; const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/); return match ? (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0) : 0; };
  const getImage = (img) => { if (!img) return ''; if (typeof img === 'string') return img; if (Array.isArray(img)) return getImage(img[0]); return img.url || img.contentUrl || ''; };
  return { title: getText(data.name), description: getText(data.description), ingredients: getList(data.recipeIngredient), steps: getSteps(data.recipeInstructions), imageUrl: getImage(data.image), prepTime: getTime(data.prepTime), cookTime: getTime(data.cookTime), servings: parseInt(getText(data.recipeYield)) || 0, category: mapCategory(getText(data.recipeCategory)), sourceUrl: url };
}

function extractFromMicrodata(recipeEl, doc, url) {
  const getMeta = (prop) => { const el = recipeEl.querySelector(`[itemprop="${prop}"]`); if (!el) return ''; return el.getAttribute('content') || el.textContent.trim(); };
  const getMetaAll = (prop) => [...recipeEl.querySelectorAll(`[itemprop="${prop}"]`)].map(el => el.getAttribute('content') || el.textContent.trim()).filter(Boolean);
  return { title: getMeta('name') || doc.title, description: getMeta('description'), imageUrl: getMeta('image'), ingredients: getMetaAll('recipeIngredient'), steps: getMetaAll('recipeInstructions'), prepTime: 0, cookTime: 0, servings: parseInt(getMeta('recipeYield')) || 0, category: mapCategory(getMeta('recipeCategory')), sourceUrl: url };
}

function extractFromOpengraph(doc, url) {
  const getMeta = (prop) => doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') || '';
  return { title: getMeta('og:title') || doc.title || 'Recette importée', description: getMeta('og:description'), imageUrl: getMeta('og:image'), ingredients: [], steps: [], prepTime: 0, cookTime: 0, servings: 0, category: 'Autres', sourceUrl: url };
}

function mapCategory(raw) {
  if (!raw) return 'Autres';
  const lower = raw.toLowerCase();
  if (/entr[ée]e|starter|apéritif/i.test(lower)) return 'Entrées';
  if (/plat|main|principal|poisson|viande|pasta|pizza|risotto/i.test(lower)) return 'Plats principaux';
  if (/dessert|gâteau|tarte|pâtisserie|cake|cookie/i.test(lower)) return 'Desserts';
  if (/soupe|potage|bouillon|velouté/i.test(lower)) return 'Soupes';
  if (/salade|salad/i.test(lower)) return 'Salades';
  if (/petit[- ]déj|breakfast|brunch/i.test(lower)) return 'Petits-déjeuners';
  if (/snack|amuse|bouchée/i.test(lower)) return 'Snacks';
  if (/boisson|drink|cocktail|jus|smoothie/i.test(lower)) return 'Boissons';
  return 'Autres';
}

async function importFromTikTok(url) {
  const statusEl = document.getElementById('tiktok-status');
  const previewEl = document.getElementById('tiktok-preview');
  previewEl.style.display = 'none';
  statusEl.style.display = 'block';
  statusEl.innerHTML = statusHtml('loading', '⏳ Résolution de l\'URL TikTok…');
  try {
    let fullUrl = url;
    if (/vm\.tiktok\.com|vt\.tiktok\.com/i.test(url)) { const { finalUrl } = await fetchViaProxy(url); if (finalUrl && finalUrl !== url && finalUrl.includes('tiktok.com')) fullUrl = finalUrl; }
    statusEl.innerHTML = statusHtml('loading', '⏳ Récupération des infos TikTok…');
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(fullUrl)}`;
    const { text: oembedRaw } = await fetchViaProxy(oembedUrl);
    let oembed = {};
    try { oembed = JSON.parse(oembedRaw || '{}'); } catch {}
    let title = oembed.title || '';
    let author = oembed.author_name || '';
    let thumb = oembed.thumbnail_url || '';
    if (!title) {
      const { text: pageHtml } = await fetchViaProxy(fullUrl);
      if (pageHtml) {
        const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
        for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) { try { const ld = JSON.parse(script.textContent); if (ld.description) { title = ld.description; break; } if (ld.name) { title = ld.name; break; } } catch {} }
        if (!title) title = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
        if (!thumb) thumb = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        if (!author) author = new URL(fullUrl).pathname.split('/')[1]?.replace('@','') || 'TikTok';
      }
    }
    if (!title) { statusEl.innerHTML = statusHtml('error', '⚠️ TikTok a bloqué l\'accès automatique.'); previewEl.style.display = 'block'; previewEl.innerHTML = `<div class="import-preview"><p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:12px;">Copiez la description de la vidéo TikTok et créez la recette manuellement.</p><button class="btn btn--secondary" id="btn-manual-fallback">✏️ Créer manuellement</button></div>`; document.getElementById('btn-manual-fallback').addEventListener('click', () => { renderAddEditForm(null, { sourceUrl: url, category: 'Autres' }); setActiveTab('add'); }); return; }
    statusEl.innerHTML = statusHtml('loading', '🤖 Analyse de la description…');
    const settings = getSettings();
    let recipe = settings.geminiApiKey ? await extractWithGemini(title, author, thumb, fullUrl, settings.geminiApiKey) : extractFromTikTokText(title, author, thumb, fullUrl);
    recipe = await translateRecipeIfNeeded(recipe, statusEl);
    statusEl.innerHTML = statusHtml('success', `✅ Recette « ${escapeHtml(recipe.title)} » importée depuis @${escapeHtml(author)} !`);
    showImportPreview(recipe, previewEl, 'tiktok');
  } catch (err) { console.error('[Import TikTok]', err); statusEl.innerHTML = statusHtml('error', `❌ ${err.message}`); }
}

function extractFromTikTokText(description, author, thumbUrl, sourceUrl) {
  const lines = description.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  const ingredients = [], steps = [];
  let title = lines[0] || 'Recette TikTok', mode = 'unknown';
  for (const line of lines) {
    if (/ingr[ée]dient|il vous faut|you.?ll need/i.test(line)) { mode = 'ingredients'; continue; }
    if (/[ée]tape|instruction|préparation|how to/i.test(line)) { mode = 'steps'; continue; }
    if (mode === 'ingredients') ingredients.push(line.replace(/^[-•*]\s*/, ''));
    else if (mode === 'steps') steps.push(line.replace(/^\d+[.)]\s*/, ''));
    else if (/^\d|^[½¼¾]|\d\s?(g|ml|cl|L|kg|tasse|cup|tbsp|tsp)/i.test(line)) ingredients.push(line.replace(/^[-•*]\s*/, ''));
    else if (/^\d+[.)]\s/.test(line)) steps.push(line.replace(/^\d+[.)]\s*/, ''));
  }
  return { title, description: `Recette de @${author} sur TikTok`, imageUrl: thumbUrl, ingredients, steps, category: 'Autres', sourceUrl, prepTime: 0, cookTime: 0, servings: 0 };
}

async function extractWithGemini(description, author, thumbUrl, sourceUrl, apiKey) {
  const prompt = `Tu es un assistant culinaire. Analyse ce texte TikTok et extrais la recette en JSON.\n\nTexte:\n"""\n${description}\n"""\n\nRetourne UNIQUEMENT un objet JSON:\n{"title":"...","description":"...","category":"Entrées|Plats principaux|Desserts|Soupes|Salades|Petits-déjeuners|Snacks|Boissons|Autres","ingredients":["..."],"steps":["..."],"prepTime":0,"cookTime":0,"servings":0}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } }) });
  if (!response.ok) { const err = await response.json(); throw new Error(`Gemini : ${err.error?.message || 'Erreur inconnue'}`); }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  try { const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); return { ...parsed, imageUrl: thumbUrl, sourceUrl, description: parsed.description || `Recette de @${author} sur TikTok` }; }
  catch { throw new Error('Gemini a retourné un format inattendu.'); }
}

function showImportPreview(recipe, previewEl, source) {
  const imgHtml = recipe.imageUrl ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:16px;" />` : '';
  const ingredientsHtml = recipe.ingredients?.length ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;font-weight:600;">INGRÉDIENTS (${recipe.ingredients.length})</p><ul style="list-style:disc;padding-left:20px;font-size:0.85rem;margin-bottom:12px;">${recipe.ingredients.slice(0,8).map(i => `<li>${escapeHtml(i)}</li>`).join('')}${recipe.ingredients.length > 8 ? `<li style="color:var(--text-muted)">…et ${recipe.ingredients.length - 8} autres</li>` : ''}</ul>` : '<p style="color:var(--text-muted);font-size:0.85rem;">Aucun ingrédient extrait — à compléter manuellement.</p>';
  const stepsCount = recipe.steps?.length ? `<p style="font-size:0.82rem;color:var(--text-muted);">${recipe.steps.length} étape(s) extraite(s)</p>` : '<p style="color:var(--text-muted);font-size:0.85rem;">Aucune étape extraite — à compléter manuellement.</p>';
  previewEl.style.display = 'block';
  previewEl.innerHTML = `<div class="import-preview"><div class="import-preview-title">📋 Aperçu de la recette importée</div>${imgHtml}<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:10px;">${escapeHtml(recipe.title)}</h3>${recipe.description ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">${escapeHtml(recipe.description)}</p>` : ''}${ingredientsHtml}${stepsCount}<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;"><button class="btn btn--primary" id="btn-save-import">💾 Sauvegarder directement</button><button class="btn btn--secondary" id="btn-edit-import">✏️ Modifier avant de sauvegarder</button></div></div>`;
  document.getElementById('btn-save-import').addEventListener('click', async () => { 
    if(!currentUser) return showToast("Vous devez être connecté", "error");
    const newRecipe = { ...recipe }; 
    delete newRecipe.id;
    try {
      await saveRecipe(newRecipe); 
      showToast(`"${recipe.title}" ajoutée !`, 'success'); 
      await renderRecipeGrid(); 
      setActiveTab('home'); 
    } catch(err) {
      showToast('Erreur: ' + err.message, 'error');
    }
  });
  document.getElementById('btn-edit-import').addEventListener('click', () => { renderAddEditForm(null, recipe); setActiveTab('add'); });
}

function statusHtml(type, message) {
  const spinner = type === 'loading' ? '<span class="spinner"></span>' : '';
  return `<div class="import-status ${type}">${spinner} ${message}</div>`;
}

/**
 * Recherche automatiquement une image pour la recette via Wikimedia API
 * Utilise Gemini pour extraire le mot-clé principal si la clé API est présente.
 */
async function findRecipeImage(title) {
  try {
    let keyword = title;
    const settings = getSettings();
    
    // Si Gemini est configuré, on lui demande le mot-clé principal pour améliorer la recherche
    if (settings.geminiApiKey) {
      try {
        const prompt = `Trouve le plat générique ou l'ingrédient principal (en 1 à 3 mots maximum) le plus adapté pour chercher une image sur Wikipedia de cette recette : "${title}". Exemples : "Tenders de poulets sauce miel" -> "Poulet frit", "Mousse au chocolat vegan" -> "Mousse au chocolat", "Tartare de crevettes à la mangue" -> "Tartare". Réponds UNIQUEMENT par le mot ou groupe de mots, sans ponctuation.`;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            }),
          }
        );
        const data = await response.json();
        const extracted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (extracted && extracted.length < 50) {
          keyword = extracted;
        }
      } catch (e) {
        console.warn("[findRecipeImage] Gemini a échoué, on utilise le titre complet.", e);
      }
    }

    // 1. Recherche Wikipedia pour trouver le titre de l'article exact
    const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&utf8=&format=json&origin=*`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (!data.query || !data.query.search || data.query.search.length === 0) {
      return '';
    }
    
    // 2. Récupère l'image principale de cet article
    const articleTitle = data.query.search[0].title;
    const imgUrl = `https://fr.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(articleTitle)}&origin=*`;
    const res2 = await fetch(imgUrl);
    const data2 = await res2.json();
    
    const pages = data2.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pages[pageId] && pages[pageId].original && pages[pageId].original.source) {
      return pages[pageId].original.source;
    }
    return '';
  } catch (err) {
    console.error("[findRecipeImage] Erreur de recherche d'image :", err);
    return '';
  }
}
