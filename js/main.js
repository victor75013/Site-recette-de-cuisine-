/* main.js — Point d'entrée de l'application modulaire */

import { showToast } from './core/utils.js';
import { loginWithGoogle, logout } from './core/data.js';
import { renderNavigation, bindNavigation, navigateTo } from './features/navigation/index.js';
import { closeModal } from './features/recipes/index.js';

/* ====== THEME ====== */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
  const bnavTheme = document.getElementById('bnav-theme');
  if (bnavTheme) bnavTheme.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
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

async function init() {
  renderNavigation();
  initTheme();
  bindNavigation();
  bindModalClose();
  
  const authBtn = document.getElementById('nav-auth');
  const logoutBtn = document.getElementById('nav-logout');
  
  if (authBtn) {
    authBtn.addEventListener('click', async () => {
      try {
        await loginWithGoogle();
        showToast('Connecté avec succès', 'success');
        navigateTo('home');
      } catch (err) {
        console.error(err);
        showToast('Erreur de connexion : ' + err.message, 'error', 5000);
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      showToast('Déconnecté', 'info');
      navigateTo('home');
    });
  }

  navigateTo('home');
}

function bindModalClose() {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}



document.addEventListener('DOMContentLoaded', init);
