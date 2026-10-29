/* ============================================================
   i18n/index.js — Moteur d'internationalisation & Helpers
   ============================================================ */

import fr from './fr.js';
import en from './en.js';
import { STORAGE_KEYS } from '../config.js';

const TRANSLATIONS = { fr, en };

let currentLang = typeof localStorage !== 'undefined'
  ? (localStorage.getItem(STORAGE_KEYS.LANG) || 'fr')
  : 'fr';

export function getLang() {
  return currentLang;
}

export function setLang(lang, onLangChange) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEYS.LANG, lang);
  document.documentElement.setAttribute('lang', lang);
  updateNavLabels();
  updateLangToggleBtn();
  if (typeof onLangChange === 'function') {
    onLangChange(lang);
  }
}

export function t(key) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['fr'];
  return dict[key] ?? TRANSLATIONS['fr'][key] ?? key;
}

export function updateLangToggleBtn() {
  const btn = document.getElementById('lang-toggle-btn');
  if (!btn) return;
  if (currentLang === 'en') {
    btn.innerHTML = '🇫🇷 FR';
    btn.title = 'Passer en français';
    btn.setAttribute('aria-label', 'Passer en français');
  } else {
    btn.innerHTML = '🇬🇧 EN';
    btn.title = 'Switch to English';
    btn.setAttribute('aria-label', 'Switch to English');
  }
}

export function updateNavLabels() {
  const navHome     = document.getElementById('nav-home');
  const navAdd      = document.getElementById('nav-add');
  const navImport   = document.getElementById('nav-import');
  const navSites    = document.getElementById('nav-sites');
  const navAuth     = document.getElementById('nav-auth');
  const navLogout   = document.getElementById('nav-logout');

  if (navHome)   navHome.textContent   = t('nav.recipes');
  if (navAdd)    navAdd.textContent    = t('nav.add');
  if (navImport) navImport.textContent = t('nav.import');
  if (navSites)  navSites.textContent  = t('nav.sites');
  if (navAuth && navAuth.style.display !== 'none') navAuth.textContent = t('nav.login');
  if (navLogout) navLogout.textContent = t('nav.logout');

  const bnavLabels = {
    'bnav-home':     'bnav.recipes',
    'bnav-add':      'bnav.add',
    'bnav-import':   'bnav.import',
    'bnav-sites':    'bnav.sites',
    'bnav-settings': 'bnav.settings',
  };
  Object.entries(bnavLabels).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const label = btn.querySelector('.bottom-nav-label');
    if (label) label.textContent = t(key);
  });
}

// ─── Correspondances catégories ───
export const CATEGORY_FR_TO_EN = {
  'Entrées':         'Starters',
  'Plats principaux':'Main courses',
  'Desserts':        'Desserts',
  'Soupes':          'Soups',
  'Salades':         'Salads',
  'Marinades':       'Marinades',
  'Sauces':          'Sauces',
  'Petits-déjeuners':'Breakfasts',
  'Snacks':          'Snacks',
  'Boissons':        'Drinks',
  'Autres':          'Others',
};

export const CATEGORY_EN_TO_FR = Object.fromEntries(
  Object.entries(CATEGORY_FR_TO_EN).map(([k, v]) => [v, k])
);

export function translateCategory(cat) {
  if (!cat) return cat;
  if (currentLang === 'en') return CATEGORY_FR_TO_EN[cat] || cat;
  return CATEGORY_EN_TO_FR[cat] || cat;
}

/**
 * Point 10 : getIngredientEmoji sans faux positifs grâce aux regex de mots entiers (\bword\b).
 */
const INGREDIENT_PATTERNS = [
  { regex: /\b(poulet|chicken|volaille|dinde)\b/i, emoji: '🍗' },
  { regex: /\b(boeuf|beef|steak|viande|meat)\b/i, emoji: '🥩' },
  { regex: /\b(poisson|fish|saumon|salmon|thon|tuna|cabillaud|truite)\b/i, emoji: '🐟' },
  { regex: /\b(crevette|shrimp|prawn|gambas|homard|crabe)\b/i, emoji: '🦐' },
  { regex: /\b(oeuf|oeufs|egg|eggs)\b/i, emoji: '🥚' },
  { regex: /\b(fromage|cheese|parmesan|mozzarella|cheddar|gruyere|feta)\b/i, emoji: '🧀' },
  { regex: /\b(lait|milk|creme|cream)\b/i, emoji: '🥛' },
  { regex: /\b(beurre|butter)\b/i, emoji: '🧈' },
  { regex: /\b(tomate|tomato|tomates|tomatoes)\b/i, emoji: '🍅' },
  { regex: /\b(pomme de terre|pommes de terre|potato|potatoes)\b/i, emoji: '🥔' },
  { regex: /\b(carotte|carottes|carrot|carrots)\b/i, emoji: '🥕' },
  { regex: /\b(ail|garlic)\b/i, emoji: '🧄' },
  { regex: /\b(oignon|oignons|onion|onions|echalote)\b/i, emoji: '🧅' },
  { regex: /\b(riz|rice)\b/i, emoji: '🍚' },
  { regex: /\b(pates|pasta|spaghetti|nouilles|noodles)\b/i, emoji: '🍝' },
  { regex: /\b(farine|flour)\b/i, emoji: '🌾' },
  { regex: /\b(chocolat|chocolate|cacao)\b/i, emoji: '🍫' },
  { regex: /\b(sucre|sugar|miel|honey)\b/i, emoji: '🍯' },
  { regex: /\b(citron|lemon|lime)\b/i, emoji: '🍋' },
  { regex: /\b(pomme|apple|pommes|apples)\b/i, emoji: '🍎' },
  { regex: /\b(huile|oil|vinaigre|vinegar)\b/i, emoji: '🫒' },
  { regex: /\b(pain|bread|baguette)\b/i, emoji: '🥖' },
];

export function getIngredientEmoji(ingredient) {
  if (!ingredient || typeof ingredient !== 'string') return '🥄';
  for (const { regex, emoji } of INGREDIENT_PATTERNS) {
    if (regex.test(ingredient)) return emoji;
  }
  return '🥄';
}
