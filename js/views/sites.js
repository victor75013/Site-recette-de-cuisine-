/* ============================================================
   sites.js — Page "Sites de recettes"
   ============================================================ */

const DEFAULT_SITES = [
  // ── Français ──
  { id: 'marmiton',      name: 'Marmiton',       url: 'https://www.marmiton.org',             description: 'Le site de recettes de cuisine n°1 en France.',                   emoji: '👨‍🍳', tag: '🇫🇷 Français',      color: '#e8521a' },
  { id: '750g',          name: '750g',            url: 'https://www.750g.com',                 description: 'Des milliers de recettes faciles avec photos et vidéos.',           emoji: '🍽️', tag: '🇫🇷 Français',      color: '#f4a228' },
  { id: 'cuisineaz',     name: 'Cuisine AZ',      url: 'https://www.cuisineaz.com',            description: 'Recettes simples et rapides au quotidien.',                         emoji: '🥘', tag: '🇫🇷 Français',      color: '#2e7d32' },
  { id: 'ptitchef',      name: 'Ptitchef',        url: 'https://www.ptitchef.com',             description: 'Recettes de cuisine créatives par des amateurs passionnés.',        emoji: '🍳', tag: '🇫🇷 Français',      color: '#d32f2f' },
  { id: 'lesfoodies',    name: 'Les Foodies',     url: 'https://www.lesfoodies.com',           description: 'Recettes tendances et saisonnières.',                               emoji: '🌿', tag: '🇫🇷 Français',      color: '#558b2f' },
  // ── International ──
  { id: 'allrecipes',    name: 'AllRecipes',      url: 'https://www.allrecipes.com',           description: 'La plus grande communauté de recettes au monde.',                   emoji: '🌎', tag: '🌍 International',  color: '#e53935' },
  { id: 'bbcgoodfood',   name: 'BBC Good Food',   url: 'https://www.bbcgoodfood.com',          description: 'Recettes testées et approuvées par la BBC.',                        emoji: '🫖', tag: '🌍 International',  color: '#1565c0' },
  { id: 'seriouseats',   name: 'Serious Eats',    url: 'https://www.seriouseats.com',          description: 'Recettes scientifiques et techniques culinaires.',                  emoji: '🔬', tag: '🌍 International',  color: '#6a1b9a' },
  { id: 'simplyrecipes', name: 'Simply Recipes',  url: 'https://www.simplyrecipes.com',        description: 'Recettes maison simples et délicieuses.',                           emoji: '🏡', tag: '🌍 International',  color: '#00695c' },
  { id: 'ricardocuisine',name: 'Ricardo Cuisine', url: 'https://www.ricardocuisine.com/fr',   description: 'Recettes québécoises et inspirées du monde entier.',                emoji: '🍁', tag: '🌍 International',  color: '#c62828' },
  // ── Vidéos ──
  { id: 'tiktok-food',   name: 'TikTok Cuisine',  url: 'https://www.tiktok.com/tag/recette',  description: 'Vidéos de recettes tendances sur TikTok.',                          emoji: '🎵', tag: '📱 Vidéos',         color: '#010101' },
  { id: 'youtube-cooking',name:'YouTube Cuisine',  url: 'https://www.youtube.com/results?search_query=recette+cuisine', description: 'Chaînes de cuisine et tutoriels vidéo.', emoji: '▶️', tag: '📱 Vidéos',         color: '#c62828' },
  { id: 'instagram-food', name:'Instagram Food',   url: 'https://www.instagram.com/explore/tags/recette/', description: 'Inspiration culinaire et recettes sur Instagram.',   emoji: '📸', tag: '📱 Vidéos',         color: '#ad1457' },
];

async function renderSitesPage() {
  const app = document.getElementById('app');
  const customSites = getCustomSites();
  const all = [...DEFAULT_SITES, ...customSites];

  const groups = {};
  all.forEach(site => {
    if (!groups[site.tag]) groups[site.tag] = [];
    groups[site.tag].push(site);
  });

  const groupsHtml = Object.entries(groups).map(([tag, sites]) => `
    <div class="sites-group">
      <h2 class="sites-group-title">${escapeHtml(tag)}</h2>
      <div class="sites-grid">
        ${sites.map(s => renderSiteCard(s)).join('')}
      </div>
    </div>
  `).join('');

  app.innerHTML = `
    <div class="sites-header">
      <h1 class="page-title">Sites de <span>Recettes</span></h1>
      <button class="btn btn--primary btn--sm" id="btn-add-site">+ Ajouter un site</button>
    </div>

    ${groupsHtml}

    <div id="add-site-form" class="settings-card" style="display:none;margin-top:24px;">
      <div class="settings-title">➕ Nouveau site favori</div>
      <div class="form-grid" style="margin-top:12px;">
        <div class="form-group form-group--full">
          <label class="form-label" for="new-site-name">Nom du site *</label>
          <input class="form-input" id="new-site-name" type="text" placeholder="Ex : Cuisine du monde" />
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="new-site-url">URL *</label>
          <input class="form-input" id="new-site-url" type="url" placeholder="https://..." />
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="new-site-desc">Description courte</label>
          <input class="form-input" id="new-site-desc" type="text" placeholder="Quelques mots sur ce site…" />
        </div>
        <div class="form-group">
          <label class="form-label" for="new-site-emoji">Icône (emoji)</label>
          <input class="form-input" id="new-site-emoji" type="text" placeholder="🍜" maxlength="4" style="font-size:1.4rem;" />
        </div>
        <div class="form-group">
          <label class="form-label" for="new-site-color">Couleur</label>
          <input type="color" id="new-site-color" value="#e8521a"
                 style="height:42px;width:100%;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;padding:4px;" />
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button class="btn btn--primary btn--sm" id="btn-save-site">💾 Enregistrer</button>
        <button class="btn btn--secondary btn--sm" id="btn-cancel-site">Annuler</button>
      </div>
    </div>
  `;

  app.querySelectorAll('.site-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.site-card-delete')) return;
      const url = card.dataset.url;
      if (url) window.open(url, '_blank', 'noopener');
    });
  });

  app.querySelectorAll('.site-card-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.closest('.site-card').dataset.id;
      deleteCustomSite(id);
      renderSitesPage();
    });
  });

  document.getElementById('btn-add-site').addEventListener('click', () => {
    const form = document.getElementById('add-site-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') document.getElementById('new-site-name').focus();
  });

  document.getElementById('btn-cancel-site').addEventListener('click', () => {
    document.getElementById('add-site-form').style.display = 'none';
  });

  document.getElementById('btn-save-site').addEventListener('click', () => {
    const name  = document.getElementById('new-site-name').value.trim();
    const url   = document.getElementById('new-site-url').value.trim();
    const desc  = document.getElementById('new-site-desc').value.trim();
    const emoji = document.getElementById('new-site-emoji').value.trim() || '🌐';
    const color = document.getElementById('new-site-color').value;

    if (!name) { showToast('Le nom est obligatoire.', 'error'); return; }
    if (!url || !url.startsWith('http')) { showToast('URL invalide.', 'error'); return; }

    const site = {
      id: `custom_${Date.now()}`,
      name, url, description: desc, emoji,
      tag: '⭐ Mes favoris', color, custom: true,
    };

    addCustomSite(site);
    showToast(`"${name}" ajouté !`, 'success');
    renderSitesPage();
  });
}

function renderSiteCard(site) {
  let faviconUrl = '';
  try {
    faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=32`;
  } catch { faviconUrl = ''; }

  const deleteBtn = site.custom
    ? `<button class="site-card-delete" title="Supprimer" aria-label="Supprimer ${escapeHtml(site.name)}">✕</button>`
    : '';

  let hostname = site.url;
  try { hostname = new URL(site.url).hostname; } catch {}

  return `
    <div class="site-card" data-url="${escapeHtml(site.url)}" data-id="${escapeHtml(site.id)}"
         role="button" tabindex="0" aria-label="Ouvrir ${escapeHtml(site.name)}" style="--site-color: ${escapeHtml(site.color)};">
      <div class="site-card-bar"></div>
      ${deleteBtn}
      <div class="site-card-body">
        <div class="site-card-icon">
          ${faviconUrl ? `<img src="${faviconUrl}" alt="" width="26" height="26"
               onerror="this.style.display='none';this.nextSibling.style.display='inline'"/>` : ''}
          <span style="${faviconUrl ? 'display:none;' : ''}font-size:1.5rem;">${escapeHtml(site.emoji || '🌐')}</span>
        </div>
        <div class="site-card-name">${escapeHtml(site.name)}</div>
        <div class="site-card-desc">${escapeHtml(site.description || '')}</div>
        <div class="site-card-url">${escapeHtml(hostname)}</div>
      </div>
      <div class="site-card-footer">
        <span class="site-card-open">Ouvrir ↗</span>
      </div>
    </div>
  `;
}
