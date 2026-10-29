/* ============================================================
   config.js — Configuration globale et constantes de l'app
   ============================================================ */

export const APP_VERSION = '2.0.0';

// En local, l'API est servie sur le même port que le front (http://localhost:3001)
export const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

export const STORAGE_KEYS = {
  SETTINGS: 'carnetRecettes_settings',
  SITES: 'carnetRecettes_customSites',
  THEME: 'theme',
  LANG: 'carnet_lang',
  VIEW_MODE: 'recipe_view_mode',
  TRANSLATIONS_CACHE: 'recipe_translations_cache'
};
