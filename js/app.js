/* app.js — Contrôleur principal */

let currentTab = 'home';

/* ====== THEME ====== */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
  const bnavTheme = document.getElementById('bnav-theme');
  if (bnavTheme) bnavTheme.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  localStorage.setItem('theme', theme);
  updateThemeUI(theme);
}

function updateThemeUI(theme) {
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = icon;
  const bnavIcon = document.getElementById('bnav-theme-icon');
  if (bnavIcon) bnavIcon.textContent = icon;
}

function checkFileProtocolWarning() {
  if (window.location.protocol === 'file:' && !document.getElementById('file-protocol-banner')) {
    const banner = document.createElement('div');
    banner.id = 'file-protocol-banner';
    banner.style.cssText = 'background:linear-gradient(135deg, #ef4444, #dc2626);color:#fff;padding:12px 16px;text-align:center;font-size:0.88rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 4px 12px rgba(239,68,68,0.3);position:sticky;top:0;z-index:9999;';
    banner.innerHTML = `
      <span>⚠️ <strong>Mode fichier direct (file://)</strong> — Firebase interdit la connexion depuis un fichier local. Ouvrez <strong>http://localhost:3000</strong> pour vous connecter et importer vos recettes.</span>
      <a href="http://localhost:3000" style="background:#fff;color:#dc2626;padding:5px 12px;border-radius:6px;text-decoration:none;font-size:0.82rem;font-weight:700;white-space:nowrap;">Ouvrir http://localhost:3000</a>
    `;
    document.body.prepend(banner);
  }
}

async function init() {
  initTheme();
  updateNavLabels();
  bindNavigation();
  bindModalClose();
  checkFileProtocolWarning();
  
  const authBtn = document.getElementById('nav-auth');
  const logoutBtn = document.getElementById('nav-logout');
  
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      if (window.location.protocol === 'file:') {
        showToast('Connexion impossible en mode file://. Lancez le serveur local.', 'error', 6000);
        alert("⚠️ Connexion impossible depuis un fichier local (file://).\n\nFirebase exige que l'application soit ouverte via une adresse HTTP.\n\nLancez 'Démarrer le serveur.bat' puis rendez-vous sur :\nhttp://localhost:3000");
        window.location.href = 'http://localhost:3000';
        return;
      }
      try {
        await loginWithGoogle();
        showToast(t('toast.connected'), 'success');
        navigateTo('home');
      } catch (err) {
        console.error(err);
        showToast(t('toast.error.login') + err.message, 'error', 5000);
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      showToast(t('toast.disconnected'), 'info');
      navigateTo('home');
    });
  }

  navigateTo('home');
}

function bindNavigation() {
  document.getElementById('main-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    navigateTo(btn.dataset.tab);
  });
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    bottomNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.bottom-nav-btn');
      if (!btn) return;
      navigateTo(btn.dataset.tab);
    });
  }
}

function navigateTo(tab) {
  currentTab = tab;
  setActiveTab(tab);
  switch (tab) {
    case 'home':     renderRecipeGrid(); break;
    case 'add':      renderAddEditForm(); break;
    case 'import':   renderImportPage(); break;
    case 'sites':    renderSitesPage(); break;
    case 'settings': renderSettingsPage(); break;
    default:         renderRecipeGrid();
  }
}

function setActiveTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
}

function bindModalClose() {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function renderSettingsPage() {
  const app = document.getElementById('app');
  const settings = getSettings();
  const lang = getLang();

  app.innerHTML = `
    <h1 class="form-page-title">${t('settings.title')}</h1>
    <div class="settings-container">

      <div class="settings-card">
        <div class="settings-title">${t('settings.language.title')}</div>
        <div class="settings-row">
          <label class="settings-label" for="lang-select">${t('settings.language.label')}</label>
          <div style="display:flex;gap:10px;margin-top:8px;">
            <button class="lang-btn ${lang === 'fr' ? 'active' : ''}" data-lang="fr" id="lang-fr" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:10px;border:2px solid ${lang === 'fr' ? 'var(--accent)' : 'var(--border)'};background:${lang === 'fr' ? 'var(--accent)' : 'var(--surface-2)'};color:${lang === 'fr' ? '#fff' : 'var(--text)'};font-weight:600;cursor:pointer;font-size:0.9rem;transition:all 0.2s;">
              🇫🇷 Français
            </button>
            <button class="lang-btn ${lang === 'en' ? 'active' : ''}" data-lang="en" id="lang-en" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:10px;border:2px solid ${lang === 'en' ? 'var(--accent)' : 'var(--border)'};background:${lang === 'en' ? 'var(--accent)' : 'var(--surface-2)'};color:${lang === 'en' ? '#fff' : 'var(--text)'};font-weight:600;cursor:pointer;font-size:0.9rem;transition:all 0.2s;">
              🇬🇧 English
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-title">${t('settings.ai.title')}</div>
        <div class="settings-row">
          <label class="settings-label" for="gemini-key">${t('settings.gemini.label')}</label>
          <input class="form-input" type="password" id="gemini-key" value="${escapeHtml(settings.geminiApiKey || '')}" placeholder="AIza..." autocomplete="off" />
          <span class="settings-hint">${t('settings.gemini.hint')} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>.</span>
        </div>
        <button class="btn btn--primary btn--sm" id="btn-save-settings">${t('settings.save')}</button>
      </div>

      <div class="settings-card">
        <div class="settings-title">${t('settings.data.title')}</div>
        <div class="settings-row">
          <span class="settings-label">${t('settings.export.label')}</span>
          <span class="settings-hint">${t('settings.export.hint')}</span>
        </div>
        <button class="btn btn--secondary btn--sm" id="btn-export" style="margin-bottom:16px;">${t('settings.export.btn')}</button>
        <div class="settings-row">
          <span class="settings-label">${t('settings.import.label')}</span>
          <span class="settings-hint">${t('settings.import.hint')}</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <input type="file" id="import-file-input" accept=".json" style="display:none" />
          <button class="btn btn--secondary btn--sm" id="btn-import-file">${t('settings.import.btn')}</button>
        </div>
        <hr class="form-divider" style="margin:20px 0;" />
        <div class="settings-row"><span class="settings-label" style="color:var(--danger);">${t('settings.danger')}</span></div>
        <button class="btn btn--danger btn--sm" id="btn-reset-data">${t('settings.delete.btn')}</button>
      </div>

      <div class="settings-card">
        <div class="settings-title">${t('settings.about.title')}</div>
        <p style="font-size:0.88rem;color:var(--text-muted);line-height:1.7;"><strong>${t('brand.name')}</strong> — ${t('settings.about.text')}</p>
      </div>
    </div>
  `;

  // Language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
    });
  });

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const key = document.getElementById('gemini-key').value.trim();
    saveSettings({ geminiApiKey: key });
    showToast(t('settings.saved'), 'success');
  });

  document.getElementById('btn-export').addEventListener('click', async () => {
    const recipes = await getAllRecipes();
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recettes_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast(t('toast.exported'), 'success');
  });

  document.getElementById('btn-import-file').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });

  document.getElementById('import-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error(t('toast.error.format'));
        if (!currentUser) throw new Error(t('toast.need.login.import'));
        let count = 0;
        for (const r of imported) { 
          if (r.title) { 
            await saveRecipe({ ...r, id: r.id || generateId() }); 
            count++; 
          } 
        }
        showToast(`${count} ${t('toast.imported')}`, 'success');
        navigateTo('home');
      } catch (err) { showToast(t('toast.error.import') + err.message, 'error'); }
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-reset-data').addEventListener('click', async () => {
    if (confirm(t('settings.delete.confirm'))) {
      if (!currentUser) return showToast(t('settings.not.connected'), 'error');
      try {
        const recipes = await getAllRecipes();
        const myRecipes = recipes.filter(r => r.createdBy === currentUser.uid);
        for (const r of myRecipes) {
          await deleteRecipe(r.id);
        }
        showToast(t('settings.deleted'), 'info');
        navigateTo('home');
      } catch(err) {
        showToast(t('toast.error.generic') + err.message, 'error');
      }
    }
  });
}

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 320); }, duration);
}

document.addEventListener('DOMContentLoaded', init);
