/* ============================================================
   importer.js — Import automatique et intelligent de recettes (ES Module)
   ============================================================ */

import { API_BASE_URL } from './config.js';
import { getSettings, saveRecipe, currentUser } from './data.js';
import { t, getLang } from './i18n/index.js';
import { escapeHtml } from './utils.js';
import { callGemini } from './services/gemini.js';
import { translateRecipeViaGoogle } from './i18n/translate-recipe.js';

const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
];

export let localServerAvailable = false;

export async function checkLocalServer() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ping`, { signal: AbortSignal.timeout(1500) });
    const json = await res.json();
    localServerAvailable = json.ok === true;
  } catch {
    localServerAvailable = false;
  }
  return localServerAvailable;
}

export async function fetchViaLocalServer(targetUrl) {
  const res = await fetch(`${API_BASE_URL}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl }),
    signal: AbortSignal.timeout(40000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  const data = await res.json();
  return { text: data.html || '', finalUrl: data.finalUrl || targetUrl };
}

export async function fetchViaProxy(targetUrl) {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(targetUrl), { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      if (proxy.includes('allorigins')) {
        const json = await res.json();
        return { text: json.contents || '', finalUrl: json.status?.url || targetUrl };
      }
      return { text: await res.text(), finalUrl: targetUrl };
    } catch {}
  }
  throw new Error('Tous les proxies ont échoué.');
}

export async function smartFetch(targetUrl) {
  if (localServerAvailable) {
    try {
      return await fetchViaLocalServer(targetUrl);
    } catch (err) {
      console.warn('[Serveur local] Échec scrape:', err.message);
    }
  }
  return fetchViaProxy(targetUrl);
}

export async function translateRecipeIfNeeded(recipe, statusEl) {
  if (localServerAvailable) {
    try {
      if (statusEl) statusEl.innerHTML = statusHtml('loading', '🌐 Traduction en français…');
      const res = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe }),
        signal: AbortSignal.timeout(30000)
      });
      const data = await res.json();
      return data.recipe || recipe;
    } catch (err) {
      console.warn('[Translate] Serveur local échoué:', err.message);
    }
  }

  const settings = getSettings();
  if (settings.geminiApiKey) {
    try {
      if (statusEl) statusEl.innerHTML = statusHtml('loading', '🤖 Traduction via Gemini…');
      const prompt = `Traduis cette recette en français. Retourne UNIQUEMENT le même objet JSON avec les champs traduits (title, description, ingredients, steps).\n${JSON.stringify({ title: recipe.title, description: recipe.description, ingredients: recipe.ingredients, steps: recipe.steps })}`;
      const rawJson = await callGemini(prompt, settings.geminiApiKey);
      const parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim());
      return { ...recipe, ...parsed };
    } catch (err) {
      console.warn('[Translate] Gemini échoué:', err.message);
    }
  }

  // Fallback client direct
  try {
    if (statusEl) statusEl.innerHTML = statusHtml('loading', '🌐 Traduction automatique…');
    return await translateRecipeViaGoogle(recipe, 'fr');
  } catch {
    return recipe;
  }
}

export async function renderImportPage() {
  const app = document.getElementById('app');
  const urlPlaceholder = getLang() === 'en'
    ? 'https://www.allrecipes.com/recipe/...'
    : 'https://www.marmiton.org/recettes/...';

  app.innerHTML = `
    <h1 class="form-page-title">${t('import.title')} <span>${t('import.title.span')}</span></h1>
    <div class="import-container">
      <div id="server-badge" style="margin-bottom:20px;">
        <span class="u-text-dim" style="font-size:0.82rem;">⏳ Vérification du serveur…</span>
      </div>

      <div class="import-card" id="import-url-card">
        <div class="import-card-header">
          <span class="import-card-icon">🌐</span>
          <div>
            <div class="import-card-title">${getLang() === 'en' ? 'From a website' : 'Depuis un site web'}</div>
            <div class="import-card-sub" id="url-card-sub">Marmiton, 750g, AllRecipes, BBC Food…</div>
          </div>
        </div>
        <div class="import-row">
          <input class="form-input" type="url" id="url-input" placeholder="${urlPlaceholder}" />
          <button class="btn btn--primary" id="btn-import-url">${t('import.btn')}</button>
        </div>
        <div id="url-status" class="u-hidden u-mt-md"></div>
        <div id="url-preview" class="u-hidden u-mt-md"></div>
      </div>

      <div class="import-card" id="import-tiktok-card">
        <div class="import-card-header">
          <span class="import-card-icon">🎵</span>
          <div>
            <div class="import-card-title">${t('import.tiktok.title')}</div>
            <div class="import-card-sub">${getLang() === 'en' ? 'Extracts the recipe from the video description' : 'Extrait la recette de la description de la vidéo'}</div>
          </div>
        </div>
        <div class="import-row">
          <input class="form-input" type="url" id="tiktok-input" placeholder="https://www.tiktok.com/@user/video/..." />
          <button class="btn btn--primary" id="btn-import-tiktok">${t('import.tiktok.btn')}</button>
        </div>
        <div id="tiktok-status" class="u-hidden u-mt-md"></div>
        <div id="tiktok-preview" class="u-hidden u-mt-md"></div>
      </div>
    </div>
  `;

  const serverOk = await checkLocalServer();
  const badgeEl = document.getElementById('server-badge');
  const subEl = document.getElementById('url-card-sub');

  if (badgeEl) {
    badgeEl.innerHTML = serverOk
      ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);border-radius:20px;font-size:0.78rem;color:#22c55e;font-weight:600;"><span style="width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;"></span>${getLang() === 'en' ? 'Server active — all sites supported ✅' : 'Serveur actif — tous les sites supportés ✅'}</span>`
      : `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:20px;font-size:0.78rem;color:#fbbf24;font-weight:600;"><span style="width:7px;height:7px;border-radius:50%;background:#fbbf24;display:inline-block;"></span>${getLang() === 'en' ? 'Proxy mode — start local server for Marmiton' : 'Mode proxy — démarrez le serveur local pour Marmiton'}</span>`;
  }
  if (subEl) {
    subEl.textContent = serverOk
      ? (getLang() === 'en' ? 'Marmiton, 750g, AllRecipes, BBC Food and all others ✅' : 'Marmiton, 750g, AllRecipes, BBC Food et tous les autres ✅')
      : (getLang() === 'en' ? 'AllRecipes, BBC Food, SimplyRecipes… (Marmiton requires the server)' : 'AllRecipes, BBC Food, SimplyRecipes… (Marmiton nécessite le serveur)');
  }

  document.getElementById('btn-import-url')?.addEventListener('click', () => {
    const url = document.getElementById('url-input')?.value.trim();
    if (!url) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: getLang() === 'en' ? 'Please enter a URL.' : 'Veuillez entrer une URL.', type: 'error' } }));
      return;
    }
    importFromUrl(url);
  });

  document.getElementById('url-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-import-url')?.click();
  });

  document.getElementById('btn-import-tiktok')?.addEventListener('click', () => {
    const url = document.getElementById('tiktok-input')?.value.trim();
    if (!url) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: getLang() === 'en' ? 'Please enter a TikTok URL.' : 'Veuillez entrer une URL TikTok.', type: 'error' } }));
      return;
    }
    importFromTikTok(url);
  });

  document.getElementById('tiktok-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-import-tiktok')?.click();
  });
}

const BLOCKED_SITES = ['marmiton.org', '750g.com', 'cuisineactuelle.fr'];

export async function importFromUrl(url) {
  const statusEl = document.getElementById('url-status');
  const previewEl = document.getElementById('url-preview');
  if (!statusEl || !previewEl) return;

  previewEl.classList.add('u-hidden');
  statusEl.classList.remove('u-hidden');

  let hostname = '';
  try { hostname = new URL(url).hostname.replace('www.', ''); } catch {}

  const method = localServerAvailable ? '🖥️ Serveur' : '🌐 Proxy';
  statusEl.innerHTML = statusHtml('loading', `⏳ Récupération via ${method}…`);

  try {
    const { text: htmlString, finalUrl } = await smartFetch(url);
    if (!htmlString) throw new Error('Contenu vide reçu.');

    if (detectBlockedPage(htmlString)) {
      showBlockedSiteMessage(url, hostname, previewEl, statusEl);
      return;
    }

    statusEl.innerHTML = statusHtml('loading', '🔍 Parsing des données…');
    const recipe = parseRecipeFromHtml(htmlString, finalUrl || url);

    if (!recipe || !recipe.title || isErrorTitle(recipe.title)) {
      if (BLOCKED_SITES.some(s => hostname.includes(s)) && !localServerAvailable) {
        showBlockedSiteMessage(url, hostname, previewEl, statusEl);
      } else {
        throw new Error("Impossible d'extraire une recette. Format non standard.");
      }
      return;
    }

    const translatedRecipe = await translateRecipeIfNeeded(recipe, statusEl);
    statusEl.innerHTML = statusHtml('success', `✅ Recette importée !`);
    showImportPreview(translatedRecipe, previewEl);
  } catch (err) {
    statusEl.innerHTML = statusHtml('error', `❌ ${err.message}`);
  }
}

export async function importFromTikTok(url) {
  const statusEl = document.getElementById('tiktok-status');
  const previewEl = document.getElementById('tiktok-preview');
  if (!statusEl || !previewEl) return;

  previewEl.classList.add('u-hidden');
  statusEl.classList.remove('u-hidden');
  statusEl.innerHTML = statusHtml('loading', '🔍 Récupération de la vidéo…');

  try {
    let fullUrl = url;
    if (url.includes('vm.tiktok.com') || url.includes('/t/')) {
      const resp = await smartFetch(url);
      if (resp.finalUrl) fullUrl = resp.finalUrl;
    }

    let title = '', author = '', thumb = '';
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(fullUrl)}`;
    const oembedRes = await fetch(oembedUrl);

    if (oembedRes.ok) {
      const data = await oembedRes.json();
      title = data.title || '';
      author = data.author_name || '';
      thumb = data.thumbnail_url || '';
    }

    if (!title) {
      const { text: html } = await smartFetch(fullUrl);
      if (html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        title = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
        thumb = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        author = new URL(fullUrl).pathname.split('/')[1]?.replace('@', '') || 'TikTok';
      }
    }

    if (!title) {
      statusEl.innerHTML = statusHtml('error', '⚠️ TikTok a bloqué l\'accès automatique.');
      return;
    }

    statusEl.innerHTML = statusHtml('loading', '🤖 Analyse de la description…');
    const settings = getSettings();

    let recipe;
    if (settings.geminiApiKey) {
      const prompt = `Tu es un assistant culinaire. Analyse ce texte TikTok et extrais la recette en JSON.\n\nTexte:\n"""\n${title}\n"""\n\nRetourne UNIQUEMENT un objet JSON:\n{"title":"...","description":"...","category":"Entrées|Plats principaux|Desserts|Soupes|Salades|Petits-déjeuners|Snacks|Boissons|Autres","ingredients":["..."],"steps":["..."],"prepTime":0,"cookTime":0,"servings":0}`;
      const rawJson = await callGemini(prompt, settings.geminiApiKey);
      const parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim());
      recipe = { ...parsed, imageUrl: thumb, sourceUrl: fullUrl, description: parsed.description || `Recette de @${author} sur TikTok` };
    } else {
      recipe = extractFromTikTokText(title, author, thumb, fullUrl);
    }

    recipe = await translateRecipeIfNeeded(recipe, statusEl);
    statusEl.innerHTML = statusHtml('success', `✅ Recette « ${escapeHtml(recipe.title)} » importée !`);
    showImportPreview(recipe, previewEl);
  } catch (err) {
    statusEl.innerHTML = statusHtml('error', `❌ ${err.message}`);
  }
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

function detectBlockedPage(html) {
  if (!html || html.length < 100) return true;
  const lower = html.slice(0, 5000).toLowerCase();
  return (
    (lower.includes('cloudflare') && (lower.includes('blocked') || lower.includes('ray id'))) ||
    (lower.includes('access denied') && !lower.includes('recipe')) ||
    lower.includes('just a moment') ||
    lower.includes('enable javascript and cookies to continue') ||
    lower.includes('captcha')
  );
}

function isErrorTitle(title) {
  return /^(403|404|429|500|502|503|access denied|forbidden|error|just a moment)/i.test((title || '').trim());
}

function showBlockedSiteMessage(url, hostname, previewEl, statusEl) {
  statusEl.innerHTML = statusHtml('error', `⛔ <strong>${hostname}</strong> protège son contenu contre l'accès automatique.`);
  previewEl.classList.remove('u-hidden');
  previewEl.innerHTML = `
    <div class="import-preview">
      <div class="import-preview-title">💡 Comment importer depuis ce site ?</div>
      <p style="font-size:0.87rem;color:var(--text-muted);margin-bottom:14px;">Ce site utilise une protection anti-bot stricte.</p>
      <ol style="font-size:0.87rem;padding-left:20px;margin-bottom:16px;line-height:2;">
        <li>Ouvrez la recette dans votre navigateur</li>
        <li>Copiez le titre, les ingrédients et les étapes</li>
        <li>Collez-les dans le formulaire d'ajout</li>
      </ol>
      <button class="btn btn--primary" id="btn-open-manual-url">✏️ Créer manuellement</button>
    </div>
  `;
  document.getElementById('btn-open-manual-url')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'add', prefill: { sourceUrl: url, category: 'Autres' } } }));
  });
}

export function parseRecipeFromHtml(html, url) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      let data = JSON.parse(script.textContent);
      if (data['@graph']) data = data['@graph'];
      if (Array.isArray(data)) {
        const found = data.find(d => d['@type'] === 'Recipe' || (Array.isArray(d['@type']) && d['@type'].includes('Recipe')));
        if (found) return extractFromJsonLd(found, url);
      }
      if (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
        return extractFromJsonLd(data, url);
      }
    } catch {}
  }
  return null;
}

export function extractFromJsonLd(data, url) {
  const getText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val.replace(/<[^>]+>/g, '').trim();
    if (Array.isArray(val)) return val.map(getText).join(', ');
    if (typeof val === 'object') return (val['@value'] || val.text || val.name || '').replace(/<[^>]+>/g, '').trim();
    return String(val);
  };

  const getList = (val) => {
    if (!val) return [];
    return (Array.isArray(val) ? val : [val]).map(getText).filter(Boolean);
  };

  const getSteps = (val) => {
    if (!val) return [];
    return (Array.isArray(val) ? val : [val]).flatMap(item => {
      if (!item) return [];
      if (typeof item === 'string') return [item.replace(/<[^>]+>/g, '').trim()];
      if (item['@type'] === 'HowToStep') return [getText(item.text || item.name)];
      if (item['@type'] === 'HowToSection' && item.itemListElement) {
        const sectionTitle = getText(item.name || item.text);
        const subSteps = getSteps(item.itemListElement);
        return sectionTitle ? [`# ${sectionTitle}`, ...subSteps] : subSteps;
      }
      return [getText(item.text || item.name || item)];
    }).filter(Boolean);
  };

  const getTime = (iso) => {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
    return match ? (parseInt(match[1] || 0, 10) * 60) + parseInt(match[2] || 0, 10) : 0;
  };

  const getImage = (img) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (Array.isArray(img)) return getImage(img[0]);
    return img.url || img.contentUrl || '';
  };

  return {
    title: getText(data.name),
    description: getText(data.description),
    author: getText(data.author?.name || data.author),
    imageUrl: getImage(data.image),
    prepTime: getTime(data.prepTime),
    cookTime: getTime(data.cookTime),
    servings: parseInt(String(data.recipeYield || '').replace(/\D+/g, ''), 10) || 4,
    servingsUnit: 'personnes',
    category: Array.isArray(data.recipeCategory) ? getText(data.recipeCategory[0]) : getText(data.recipeCategory || 'Autres'),
    ingredients: getList(data.recipeIngredient),
    steps: getSteps(data.recipeInstructions),
    sourceUrl: url,
  };
}

function showImportPreview(recipe, previewEl) {
  previewEl.classList.remove('u-hidden');
  previewEl.innerHTML = `
    <div class="import-preview">
      <div class="import-preview-title">Aperçu de la recette importée</div>
      ${recipe.imageUrl ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:16px;" />` : ''}
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:10px;">${escapeHtml(recipe.title)}</h3>
      ${recipe.description ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">${escapeHtml(recipe.description)}</p>` : ''}
      <div class="u-flex u-gap-sm u-mt-md" style="flex-wrap:wrap;">
        <button class="btn btn--primary" id="btn-save-import">Sauvegarder directement</button>
        <button class="btn btn--secondary" id="btn-edit-import">Modifier avant de sauvegarder</button>
      </div>
    </div>
  `;

  document.getElementById('btn-save-import')?.addEventListener('click', async () => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('toast.not.connected'), type: 'error' } }));
      return;
    }
    const newRecipe = { ...recipe };
    delete newRecipe.id;
    try {
      await saveRecipe(newRecipe);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `"${recipe.title}" ajoutée !`, type: 'success' } }));
      window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'home' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Erreur: ' + err.message, type: 'error' } }));
    }
  });

  document.getElementById('btn-edit-import')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'add', prefill: recipe } }));
  });
}

function statusHtml(type, message) {
  const spinner = type === 'loading' ? '<span class="spinner"></span>' : '';
  return `<div class="import-status ${type}">${spinner} ${message}</div>`;
}

export async function findRecipeImage(title) {
  try {
    const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&utf8=&format=json&origin=*`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    if (!data.query?.search?.length) return '';

    const articleTitle = data.query.search[0].title;
    const imgUrl = `https://fr.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(articleTitle)}&origin=*`;
    const res2 = await fetch(imgUrl);
    const data2 = await res2.json();
    const pages = data2.query?.pages;
    const pageId = Object.keys(pages || {})[0];
    return pages?.[pageId]?.original?.source || '';
  } catch {
    return '';
  }
}
