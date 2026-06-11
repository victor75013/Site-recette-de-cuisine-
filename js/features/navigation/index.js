/* js/features/navigation/index.js — Gestion de la navigation */

import { renderRecipeGrid } from '../recipes/index.js';
import { renderAddEditForm } from '../recipe-form/index.js';
import { renderImportPage } from '../import/index.js';
import { renderSitesPage } from '../sites/index.js';
import { renderSettingsPage } from '../settings/index.js';

export let currentTab = 'home';

/* ====== CONFIGURATION DE LA NAVIGATION ====== */
const NAV_ITEMS = [
  { id: 'home', label: 'Mes Recettes', icon: '📖', action: () => renderRecipeGrid() },
  { id: 'add', label: 'Ajouter', icon: '✏️', action: () => renderAddEditForm() },
  { id: 'import', label: 'Importer', icon: '🔗', action: () => renderImportPage() },
  { id: 'sites', label: 'Sites', icon: '🌍', action: () => renderSitesPage() },
  { id: 'settings', label: 'Paramètres', icon: '⚙️', action: () => renderSettingsPage(), isSettings: true, mobileLabel: 'Réglages' }
];

export function renderNavigation() {
  const mainNav = document.getElementById('main-nav');
  if (mainNav) {
    const buttonsHtml = NAV_ITEMS.map(item => {
      if (item.isSettings) {
        return `<button class="nav-btn nav-btn--settings" data-tab="${item.id}" id="nav-${item.id}" title="${item.label}">${item.icon}</button>`;
      }
      return `<button class="nav-btn" data-tab="${item.id}" id="nav-${item.id}"><span class="nav-icon">${item.icon}</span> ${item.label}</button>`;
    }).join('');
    mainNav.innerHTML = buttonsHtml + `
      <button class="theme-toggle" id="theme-toggle-btn" title="Changer de thème" aria-label="Basculer thème clair/sombre">
        🌙
      </button>
    `;
  }

  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    const bnavHtml = NAV_ITEMS.map(item => {
      const label = item.mobileLabel || item.label;
      return `<button class="bottom-nav-btn" data-tab="${item.id}" id="bnav-${item.id}">
        <span class="bottom-nav-icon">${item.icon}</span>
        <span class="bottom-nav-label">${label}</span>
      </button>`;
    }).join('');
    bottomNav.innerHTML = bnavHtml + `
      <button class="bottom-nav-btn" id="bnav-theme" aria-label="Basculer thème" style="color:var(--text-dim);">
        <span class="bottom-nav-icon" id="bnav-theme-icon">🌙</span>
        <span class="bottom-nav-label">Thème</span>
      </button>
    `;
  }
}

export function bindNavigation() {
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

export function navigateTo(tab) {
  currentTab = tab;
  setActiveTab(tab);
  const item = NAV_ITEMS.find(i => i.id === tab);
  if (item && typeof item.action === 'function') {
    item.action();
  } else {
    renderRecipeGrid();
  }
}

export function setActiveTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
}
