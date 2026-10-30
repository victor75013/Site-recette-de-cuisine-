/* ============================================================
   app.js — Contrôleur principal de l'application (ES Module)
   ============================================================ */

import { STORAGE_KEYS } from './config.js';
import { initAuth, loginWithGoogle, logout, currentUser, getSettings, saveSettings, getAllRecipes, saveRecipe, deleteRecipe } from './data.js';
import { t, getLang, setLang, updateNavLabels, updateLangToggleBtn } from './i18n/index.js';
import { escapeHtml, generateId } from './utils.js';
import { renderRecipeGrid, closeModal } from './recipes.js';
import { renderAddEditForm } from './form.js';
import { renderImportPage } from './importer.js';
import { renderSitesPage } from './sites.js';

let currentTab = 'home';

/* ====== THEME ====== */
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  applyTheme(saved);
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  updateThemeUI(theme);
}

function updateThemeUI(theme) {
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = icon;
}

/* ====== TOAST NOTIFICATIONS ====== */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

/* ====== NAVIGATION ====== */
export function navigateTo(tab, extraData = {}) {
  currentTab = tab;
  setActiveTab(tab);
  switch (tab) {
    case 'home':
      renderRecipeGrid();
      break;
    case 'add':
      renderAddEditForm(extraData.editId, extraData.prefill);
      break;
    case 'import':
      renderImportPage();
      break;
    case 'sites':
      renderSitesPage();
      break;
    case 'settings':
      renderSettingsPage();
      break;
    default:
      renderRecipeGrid();
  }
}

function setActiveTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
}

function bindNavigation() {
  document.getElementById('main-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn || !btn.dataset.tab) return;
    navigateTo(btn.dataset.tab);
  });

  document.getElementById('bottom-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.bottom-nav-btn');
    if (!btn || !btn.dataset.tab) return;
    navigateTo(btn.dataset.tab);
  });
}

function bindModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  const overlay = document.getElementById('modal-overlay');
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

/* ====== SETTINGS PAGE ====== */
export function renderSettingsPage() {
  const app = document.getElementById('app');
  const settings = getSettings();
  const lang = getLang();

  app.innerHTML = `
    <h1 class="form-page-title">${t('settings.title')}</h1>
    <div class="settings-container">

      <div class="settings-card">
        <div class="settings-title">${t('settings.language.title')}</div>
        <div class="settings-row">
          <label class="settings-label">${t('settings.language.label')}</label>
          <div class="u-flex u-gap-sm u-mt-sm">
            <button class="btn ${lang === 'fr' ? 'btn--primary' : 'btn--secondary'} btn--sm lang-btn" data-lang="fr">
              🇫🇷 Français
            </button>
            <button class="btn ${lang === 'en' ? 'btn--primary' : 'btn--secondary'} btn--sm lang-btn" data-lang="en">
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
          <span class="settings-hint">${t('settings.gemini.hint')} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.</span>
        </div>
        <button class="btn btn--primary btn--sm" id="btn-save-settings">${t('settings.save')}</button>
      </div>

      <div class="settings-card">
        <div class="settings-title">${t('settings.data.title')}</div>
        <div class="settings-row">
          <span class="settings-label">${t('settings.export.label')}</span>
          <span class="settings-hint">${t('settings.export.hint')}</span>
        </div>
        <button class="btn btn--secondary btn--sm u-mb-md" id="btn-export">${t('settings.export.btn')}</button>

        <div class="settings-row">
          <span class="settings-label">${t('settings.import.label')}</span>
          <span class="settings-hint">${t('settings.import.hint')}</span>
        </div>
        <div class="u-flex u-gap-sm" style="align-items:center;">
          <input type="file" id="import-file-input" accept=".json" class="u-hidden" />
          <button class="btn btn--secondary btn--sm" id="btn-import-file">${t('settings.import.btn')}</button>
        </div>

        <hr class="form-divider" />
        <div class="settings-row">
          <span class="settings-label u-text-danger">${t('settings.danger')}</span>
        </div>
        <button class="btn btn--danger btn--sm" id="btn-reset-data">${t('settings.delete.btn')}</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang, () => navigateTo('settings'));
    });
  });

  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    const key = document.getElementById('gemini-key')?.value.trim();
    saveSettings({ geminiApiKey: key });
    showToast(t('settings.saved'), 'success');
  });

  document.getElementById('btn-export')?.addEventListener('click', async () => {
    const recipes = await getAllRecipes();
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recettes_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast(t('toast.exported'), 'success');
  });

  document.getElementById('btn-import-file')?.addEventListener('click', () => {
    document.getElementById('import-file-input')?.click();
  });

  document.getElementById('import-file-input')?.addEventListener('change', (e) => {
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
      } catch (err) {
        showToast(t('toast.error.import') + err.message, 'error');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-reset-data')?.addEventListener('click', async () => {
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
      } catch (err) {
        showToast(t('toast.error.generic') + err.message, 'error');
      }
    }
  });
}

/* ====== INITIALISATION ====== */
async function init() {
  initTheme();
  updateNavLabels();
  updateLangToggleBtn();
  bindNavigation();
  bindModal();

  document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
    setLang(getLang() === 'fr' ? 'en' : 'fr', () => navigateTo(currentTab));
  });

  const authBtn = document.getElementById('nav-auth');
  const logoutBtn = document.getElementById('nav-logout');

  authBtn?.addEventListener('click', async () => {
    try {
      await loginWithGoogle();
      showToast(t('toast.connected'), 'success');
      navigateTo('home');
    } catch (err) {
      showToast(t('toast.error.login') + err.message, 'error');
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    await logout();
    showToast(t('toast.disconnected'), 'info');
    navigateTo('home');
  });

  // Écouteurs d'événements globaux pour la communication inter-modules
  window.addEventListener('app:navigate', (e) => {
    if (e.detail?.tab) navigateTo(e.detail.tab, e.detail);
  });
  window.addEventListener('app:toast', (e) => {
    if (e.detail?.message) showToast(e.detail.message, e.detail.type || 'info');
  });

  initAuth(() => {
    if (currentTab === 'home') renderRecipeGrid();
  });

  navigateTo('home');
}

document.addEventListener('DOMContentLoaded', init);
