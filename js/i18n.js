/* ============================================================
   i18n.js — Internationalisation FR / EN
   ============================================================ */

const TRANSLATIONS = {
  fr: {
    // Navigation
    'nav.recipes':   'Mes Recettes',
    'nav.add':       'Ajouter',
    'nav.import':    'Importer',
    'nav.sites':     'Sites',
    'nav.settings':  '⚙️',
    'nav.login':     'Se connecter',
    'nav.logout':    'Quitter',
    'nav.theme':     'Thème',

    // Bottom nav labels
    'bnav.recipes':  'Recettes',
    'bnav.add':      'Ajouter',
    'bnav.import':   'Importer',
    'bnav.sites':    'Sites',
    'bnav.settings': 'Réglages',
    'bnav.theme':    'Thème',

    // Home page
    'home.title':         'Mes',
    'home.title.span':    'Recettes',
    'home.all':           'Toutes',
    'home.search':        'Rechercher une recette, un ingrédient…',
    'home.count.one':     'recette',
    'home.count.many':    'recettes',
    'home.loading':       'Chargement des recettes...',
    'home.empty.title':   "Aucune recette pour l'instant",
    'home.empty.text':    'Commencez par ajouter ou importer une recette.',
    'home.noresult.title':'Aucune recette trouvée',
    'home.noresult.text': "Essayez d'autres termes.",

    // Recipe detail
    'detail.edit':        '✏️ Modifier',
    'detail.delete':      '🗑️ Supprimer',
    'detail.delete.confirm': 'Voulez-vous vraiment supprimer',
    'detail.view.classic':'🎨 Vue Classique',
    'detail.view.cookbook':'📖 Mode Livre',
    'detail.ingredients': 'Ingrédients',
    'detail.steps':       'Étapes de préparation',
    'detail.source':      'Source :',
    'detail.for':         'POUR',
    'detail.persons':     'PERSONNES',
    'detail.prep':        'PRÉPARATION :',
    'detail.cook':        'CUISSON :',
    'detail.tip':         'Astuce :',
    'detail.nutrition.loading': '🌿 Recherche Open Food Facts…',
    'detail.nutrition.unavailable': 'ℹ️ Valeurs nutritionnelles non disponibles pour ces ingrédients.',
    'detail.nutrition.error': '⚠️ Erreur :',
    'detail.nutrition.retry': '🔄 Réessayer',
    'detail.nutrition.analysis': 'Analyse nutritionnelle en cours...',

    // Form
    'form.new.title':     '🍴 Nouvelle recette',
    'form.edit.title':    '✏️ Modifier la recette',
    'form.loading':       'Chargement...',
    'form.title.label':   'Titre',
    'form.title.placeholder': 'Ex : Risotto aux champignons',
    'form.category.label': 'Catégorie',
    'form.category.choose': '— Choisir —',
    'form.author.label':  'Auteur de la recette',
    'form.author.placeholder': 'Ex : Victor',
    'form.qty.label':     'Quantité',
    'form.qty.placeholder': 'Ex : 4',
    'form.prep.label':    'Temps de préparation (min)',
    'form.prep.placeholder': 'Ex : 15',
    'form.cook.label':    'Temps de cuisson (min)',
    'form.cook.placeholder': 'Ex : 30',
    'form.desc.label':    'Brève description',
    'form.desc.placeholder': 'Un bref résumé de la recette…',
    'form.image.label':   "URL de l'image",
    'form.source.label':  "Source / URL d'origine",
    'form.ingredients.title': '🥄 Ingrédients',
    'form.add.ingredient': '+ Ajouter un ingrédient',
    'form.add.section':   '+ Ajouter une sous-partie',
    'form.steps.title':   '📋 Étapes de préparation',
    'form.add.step':      '+ Ajouter une étape',
    'form.cancel':        'Annuler',
    'form.save.new':      '💾 Sauvegarder la recette',
    'form.save.edit':     '💾 Mettre à jour',
    'form.saving':        '⏳ Sauvegarde...',
    'form.ing.placeholder.header': 'Ex : Pour la sauce',
    'form.ing.placeholder.item':   'Ex : 200g de farine',
    'form.step.placeholder.header': 'Ex : Pour la sauce, Préparation de la pâte…',
    'form.step.placeholder.item':   'Décrivez cette étape…',

    // Categories
    'cat.starters':   'Entrées',
    'cat.mains':      'Plats principaux',
    'cat.desserts':   'Desserts',
    'cat.soups':      'Soupes',
    'cat.salads':     'Salades',
    'cat.marinades':  'Marinades',
    'cat.sauces':     'Sauces',
    'cat.breakfast':  'Petits-déjeuners',
    'cat.snacks':     'Snacks',
    'cat.drinks':     'Boissons',
    'cat.others':     'Autres',

    // Servings units
    'unit.people':  'personnes',
    'unit.portions':'portions',
    'unit.pieces':  'pièces',
    'unit.kg':      'kg',
    'unit.g':       'g',
    'unit.liters':  'litres',
    'unit.cl':      'cl',

    // Settings
    'settings.title':           '⚙️ Paramètres',
    'settings.ai.title':        '🤖 Intelligence Artificielle',
    'settings.gemini.label':    'Clé API Gemini (optionnel)',
    'settings.gemini.hint':     "Permet à Gemini d'extraire les recettes TikTok. Clé gratuite sur",
    'settings.save':            '💾 Sauvegarder',
    'settings.data.title':      '🗄️ Données',
    'settings.export.label':    'Exporter toutes les recettes',
    'settings.export.hint':     'Télécharge un fichier JSON avec toutes vos recettes.',
    'settings.export.btn':      '⬇️ Exporter (JSON)',
    'settings.import.label':    'Importer un fichier de recettes',
    'settings.import.hint':     'Fusionne des recettes depuis un export JSON.',
    'settings.import.btn':      '⬆️ Importer (JSON)',
    'settings.danger':          'Zone dangereuse',
    'settings.delete.btn':      '🗑️ Supprimer toutes les recettes',
    'settings.about.title':     'ℹ️ À propos',
    'settings.about.text':      'Stockage local (localStorage). Vos recettes sont sauvegardées sur cet appareil.',
    'settings.language.title':  '🌐 Langue / Language',
    'settings.language.label':  'Choisir la langue',
    'settings.saved':           'Paramètres sauvegardés.',
    'settings.delete.confirm':  'Voulez-vous vraiment supprimer toutes VOS recettes du cloud ? Cette action est irréversible.',
    'settings.not.connected':   'Vous devez être connecté.',
    'settings.deleted':         'Vos recettes ont été supprimées.',

    // Toast messages
    'toast.connected':    'Connecté avec succès',
    'toast.disconnected': 'Déconnecté',
    'toast.saved':        'Recette sauvegardée !',
    'toast.updated':      'Recette mise à jour !',
    'toast.deleted':      'Recette supprimée.',
    'toast.exported':     'Export téléchargé !',
    'toast.title.required': 'Le titre est obligatoire.',
    'toast.not.connected':  'Vous devez être connecté pour sauvegarder une recette.',
    'toast.error.login':    'Erreur de connexion : ',
    'toast.error.generic':  'Erreur: ',
    'toast.imported':       'recette(s) importée(s) !',
    'toast.error.import':   'Erreur import : ',
    'toast.error.format':   'Format invalide.',
    'toast.need.login.import': 'Vous devez être connecté pour importer.',

    // Sites page
    'sites.title':        'Sites de',
    'sites.title.span':   'Recettes',
    'sites.add.btn':      '+ Ajouter un site',
    'sites.new.form.title': '➕ Nouveau site favori',
    'sites.name.label':   'Nom du site *',
    'sites.name.placeholder': 'Ex : Cuisine du monde',
    'sites.url.label':    'URL *',
    'sites.desc.label':   'Description courte',
    'sites.desc.placeholder': 'Quelques mots sur ce site…',
    'sites.emoji.label':  'Icône (emoji)',
    'sites.color.label':  'Couleur',
    'sites.save.btn':     '💾 Enregistrer',
    'sites.cancel.btn':   'Annuler',
    'sites.open':         'Ouvrir ↗',
    'sites.name.required': 'Le nom est obligatoire.',
    'sites.url.invalid':  'URL invalide.',
    'sites.added':        'ajouté !',

    // Import page
    'import.title':       'Importer une',
    'import.title.span':  'Recette',
    'import.url.label':   'URL de la recette',
    'import.url.placeholder': 'https://www.marmiton.org/...',
    'import.btn':         '🔍 Importer',
    'import.tiktok.title': '🎵 TikTok / Vidéo',
    'import.tiktok.url.label': 'Lien de la vidéo TikTok',
    'import.tiktok.btn':  '🎵 Extraire la recette',

    // Badges / detail
    'badge.prep':   '🥣 Prépa : ',
    'badge.cook':   '🔥 Cuisson : ',
    'badge.total':  '⏱️ Total : ',

    // Misc
    'brand.name':   'Carnet de Recettes',
    'modal.close':  '✕',
    'category.all': 'TOUS',
  },

  en: {
    // Navigation
    'nav.recipes':   'My Recipes',
    'nav.add':       'Add',
    'nav.import':    'Import',
    'nav.sites':     'Sites',
    'nav.settings':  '⚙️',
    'nav.login':     'Sign in',
    'nav.logout':    'Sign out',
    'nav.theme':     'Theme',

    // Bottom nav labels
    'bnav.recipes':  'Recipes',
    'bnav.add':      'Add',
    'bnav.import':   'Import',
    'bnav.sites':    'Sites',
    'bnav.settings': 'Settings',
    'bnav.theme':    'Theme',

    // Home page
    'home.title':         'My',
    'home.title.span':    'Recipes',
    'home.all':           'All',
    'home.search':        'Search a recipe, an ingredient…',
    'home.count.one':     'recipe',
    'home.count.many':    'recipes',
    'home.loading':       'Loading recipes...',
    'home.empty.title':   'No recipes yet',
    'home.empty.text':    'Start by adding or importing a recipe.',
    'home.noresult.title':'No recipes found',
    'home.noresult.text': 'Try different terms.',

    // Recipe detail
    'detail.edit':        '✏️ Edit',
    'detail.delete':      '🗑️ Delete',
    'detail.delete.confirm': 'Are you sure you want to delete',
    'detail.view.classic':'🎨 Classic View',
    'detail.view.cookbook':'📖 Cookbook Mode',
    'detail.ingredients': 'Ingredients',
    'detail.steps':       'Preparation steps',
    'detail.source':      'Source:',
    'detail.for':         'FOR',
    'detail.persons':     'PEOPLE',
    'detail.prep':        'PREP:',
    'detail.cook':        'COOK:',
    'detail.tip':         'Tip:',
    'detail.nutrition.loading': '🌿 Searching Open Food Facts…',
    'detail.nutrition.unavailable': 'ℹ️ Nutritional values not available for these ingredients.',
    'detail.nutrition.error': '⚠️ Error:',
    'detail.nutrition.retry': '🔄 Retry',
    'detail.nutrition.analysis': 'Nutritional analysis in progress...',

    // Form
    'form.new.title':     '🍴 New Recipe',
    'form.edit.title':    '✏️ Edit Recipe',
    'form.loading':       'Loading...',
    'form.title.label':   'Title',
    'form.title.placeholder': 'E.g. Mushroom Risotto',
    'form.category.label': 'Category',
    'form.category.choose': '— Choose —',
    'form.author.label':  'Recipe author',
    'form.author.placeholder': 'E.g. Victor',
    'form.qty.label':     'Quantity',
    'form.qty.placeholder': 'E.g. 4',
    'form.prep.label':    'Preparation time (min)',
    'form.prep.placeholder': 'E.g. 15',
    'form.cook.label':    'Cooking time (min)',
    'form.cook.placeholder': 'E.g. 30',
    'form.desc.label':    'Brief description',
    'form.desc.placeholder': 'A short summary of the recipe…',
    'form.image.label':   'Image URL',
    'form.source.label':  'Source / Original URL',
    'form.ingredients.title': '🥄 Ingredients',
    'form.add.ingredient': '+ Add ingredient',
    'form.add.section':   '+ Add sub-section',
    'form.steps.title':   '📋 Preparation Steps',
    'form.add.step':      '+ Add step',
    'form.cancel':        'Cancel',
    'form.save.new':      '💾 Save Recipe',
    'form.save.edit':     '💾 Update',
    'form.saving':        '⏳ Saving...',
    'form.ing.placeholder.header': 'E.g. For the sauce',
    'form.ing.placeholder.item':   'E.g. 200g flour',
    'form.step.placeholder.header': 'E.g. For the sauce, Dough preparation…',
    'form.step.placeholder.item':   'Describe this step…',

    // Categories
    'cat.starters':   'Starters',
    'cat.mains':      'Main courses',
    'cat.desserts':   'Desserts',
    'cat.soups':      'Soups',
    'cat.salads':     'Salads',
    'cat.marinades':  'Marinades',
    'cat.sauces':     'Sauces',
    'cat.breakfast':  'Breakfasts',
    'cat.snacks':     'Snacks',
    'cat.drinks':     'Drinks',
    'cat.others':     'Others',

    // Servings units
    'unit.people':  'people',
    'unit.portions':'portions',
    'unit.pieces':  'pieces',
    'unit.kg':      'kg',
    'unit.g':       'g',
    'unit.liters':  'liters',
    'unit.cl':      'cl',

    // Settings
    'settings.title':           '⚙️ Settings',
    'settings.ai.title':        '🤖 Artificial Intelligence',
    'settings.gemini.label':    'Gemini API Key (optional)',
    'settings.gemini.hint':     'Allows Gemini to extract TikTok recipes. Free key at',
    'settings.save':            '💾 Save',
    'settings.data.title':      '🗄️ Data',
    'settings.export.label':    'Export all recipes',
    'settings.export.hint':     'Downloads a JSON file with all your recipes.',
    'settings.export.btn':      '⬇️ Export (JSON)',
    'settings.import.label':    'Import a recipe file',
    'settings.import.hint':     'Merges recipes from a JSON export.',
    'settings.import.btn':      '⬆️ Import (JSON)',
    'settings.danger':          'Danger zone',
    'settings.delete.btn':      '🗑️ Delete all recipes',
    'settings.about.title':     'ℹ️ About',
    'settings.about.text':      'Local storage (localStorage). Your recipes are saved on this device.',
    'settings.language.title':  '🌐 Language / Langue',
    'settings.language.label':  'Choose language',
    'settings.saved':           'Settings saved.',
    'settings.delete.confirm':  'Do you really want to delete ALL YOUR recipes from the cloud? This action is irreversible.',
    'settings.not.connected':   'You must be logged in.',
    'settings.deleted':         'Your recipes have been deleted.',

    // Toast messages
    'toast.connected':    'Successfully connected',
    'toast.disconnected': 'Signed out',
    'toast.saved':        'Recipe saved!',
    'toast.updated':      'Recipe updated!',
    'toast.deleted':      'Recipe deleted.',
    'toast.exported':     'Export downloaded!',
    'toast.title.required': 'Title is required.',
    'toast.not.connected':  'You must be logged in to save a recipe.',
    'toast.error.login':    'Login error: ',
    'toast.error.generic':  'Error: ',
    'toast.imported':       'recipe(s) imported!',
    'toast.error.import':   'Import error: ',
    'toast.error.format':   'Invalid format.',
    'toast.need.login.import': 'You must be logged in to import.',

    // Sites page
    'sites.title':        'Recipe',
    'sites.title.span':   'Sites',
    'sites.add.btn':      '+ Add a site',
    'sites.new.form.title': '➕ New favourite site',
    'sites.name.label':   'Site name *',
    'sites.name.placeholder': 'E.g. World Cuisine',
    'sites.url.label':    'URL *',
    'sites.desc.label':   'Short description',
    'sites.desc.placeholder': 'A few words about this site…',
    'sites.emoji.label':  'Icon (emoji)',
    'sites.color.label':  'Color',
    'sites.save.btn':     '💾 Save',
    'sites.cancel.btn':   'Cancel',
    'sites.open':         'Open ↗',
    'sites.name.required': 'Name is required.',
    'sites.url.invalid':  'Invalid URL.',
    'sites.added':        'added!',

    // Import page
    'import.title':       'Import a',
    'import.title.span':  'Recipe',
    'import.url.label':   'Recipe URL',
    'import.url.placeholder': 'https://www.allrecipes.com/...',
    'import.btn':         '🔍 Import',
    'import.tiktok.title': '🎵 TikTok / Video',
    'import.tiktok.url.label': 'TikTok video link',
    'import.tiktok.btn':  '🎵 Extract recipe',

    // Badges / detail
    'badge.prep':   '🥣 Prep: ',
    'badge.cook':   '🔥 Cook: ',
    'badge.total':  '⏱️ Total: ',

    // Misc
    'brand.name':   'Recipe Book',
    'modal.close':  '✕',
    'category.all': 'ALL',
  }
};

// ─── Langue courante ───────────────────────────────────────────
let currentLang = localStorage.getItem('lang') || 'fr';

function getLang() { return currentLang; }

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.setAttribute('lang', lang);
  updateNavLabels();
  updateLangToggleBtn();
  if (typeof navigateTo === 'function' && typeof currentTab !== 'undefined') {
    navigateTo(currentTab);
  }
}

function updateLangToggleBtn() {
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

function t(key) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['fr'];
  return dict[key] ?? TRANSLATIONS['fr'][key] ?? key;
}

function updateNavLabels() {
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
  if (navAuth && navAuth.style.display !== 'none')   navAuth.textContent   = t('nav.login');
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

// Apply lang attribute and button on load
document.documentElement.setAttribute('lang', currentLang);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateLangToggleBtn);
} else {
  updateLangToggleBtn();
}

// ─── Traduction des catégories (mapping statique FR ↔ EN) ──────
const CATEGORY_FR_TO_EN = {
  'Entrées':        'Starters',
  'Plats principaux':'Main courses',
  'Desserts':       'Desserts',
  'Soupes':         'Soups',
  'Salades':        'Salads',
  'Marinades':      'Marinades',
  'Sauces':         'Sauces',
  'Petits-déjeuners':'Breakfasts',
  'Snacks':         'Snacks',
  'Boissons':       'Drinks',
  'Autres':         'Others',
};

const CATEGORY_EN_TO_FR = Object.fromEntries(
  Object.entries(CATEGORY_FR_TO_EN).map(([k, v]) => [v, k])
);

/**
 * Traduit le nom d'une catégorie selon la langue courante.
 * Les catégories sont stockées en FR dans Firestore.
 */
function translateCategory(cat) {
  if (!cat) return cat;
  if (currentLang === 'en') return CATEGORY_FR_TO_EN[cat] || cat;
  return CATEGORY_EN_TO_FR[cat] || cat;
}

// ─── Cache des traductions de recettes ─────────────────────────
const RECIPE_TRANS_KEY = 'recipe_trans_en_v1';

function getTranslationCache() {
  try { return JSON.parse(localStorage.getItem(RECIPE_TRANS_KEY) || '{}'); }
  catch { return {}; }
}

function setTranslationCache(cache) {
  try { localStorage.setItem(RECIPE_TRANS_KEY, JSON.stringify(cache)); }
  catch (e) { console.warn('[TransCache] Impossible de sauvegarder:', e); }
}

/** Efface le cache de traduction d'une recette (utile si modifiée). */
function clearRecipeTranslation(recipeId) {
  const cache = getTranslationCache();
  delete cache[recipeId];
  setTranslationCache(cache);
}

/**
 * Traduction de texte unitaire via Google Translate client-side (GTX).
 */
async function translateTextClient(text, targetLang = 'en') {
  if (!text || !text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return text;
    const data = await res.json();
    return data[0]?.map(chunk => chunk[0]).join('') || text;
  } catch {
    return text;
  }
}

/**
 * Traduction complète et ultra-rapide d'une recette via Google Translate client.
 * Regroupe tous les champs en une seule requête avec délimiteur.
 */
async function translateRecipeViaGoogle(recipe, targetLang = 'en') {
  const DELIM = '\n=====\n';
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const items = [
    recipe.title || '',
    recipe.description || '',
    ...ingredients,
    '___STEPS_DELIM___',
    ...steps,
  ];

  try {
    const joined = items.join(DELIM);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(joined)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data[0]?.map(chunk => chunk[0]).join('') || '';
    const parts = text.split(DELIM).map(s => s.trim());

    const sepIdx = parts.indexOf('___STEPS_DELIM___');
    if (sepIdx !== -1) {
      const title = parts[0] || recipe.title;
      const description = parts[1] || recipe.description;
      const transIngredients = parts.slice(2, sepIdx);
      const transSteps = parts.slice(sepIdx + 1);
      return {
        title,
        description,
        ingredients: transIngredients.length ? transIngredients : ingredients,
        steps: transSteps.length ? transSteps : steps,
        category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category,
      };
    }
  } catch (err) {
    console.warn('[translateRecipeViaGoogle] Fetch groupé échoué, essai direct:', err.message);
  }

  // Fallback direct si découpage échoue
  try {
    const [title, description] = await Promise.all([
      translateTextClient(recipe.title || '', targetLang),
      translateTextClient(recipe.description || '', targetLang),
    ]);
    return {
      title,
      description,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category,
    };
  } catch {
    return {
      ...recipe,
      category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category,
    };
  }
}

/**
 * Retourne la recette affichée selon la langue courante.
 * - Si FR : retourne la recette originale.
 * - Si EN : vérifie le cache puis appelle l'API de traduction si nécessaire.
 */
async function translateRecipeForDisplay(recipe) {
  if (currentLang !== 'en') return recipe;
  if (!recipe || !recipe.id) return recipe;

  // 1. Vérifier le cache complet
  const cache = getTranslationCache();
  if (cache[recipe.id] && cache[recipe.id].ingredients?.length) {
    return { ...recipe, ...cache[recipe.id] };
  }

  // 2. Client direct Google Translate (rapide ~0.3s, aucun serveur requis)
  try {
    const tr = await translateRecipeViaGoogle(recipe, 'en');
    if (tr && tr.title) {
      const fields = _pickTranslatedFields(tr, recipe);
      cache[recipe.id] = fields;
      setTranslationCache(cache);
      return { ...recipe, ...fields };
    }
  } catch (e) {
    console.warn('[Translate] Client failed:', e);
  }

  // 3. Essayer le serveur local (si démarré)
  try {
    const res = await fetch('http://localhost:3001/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe, targetLang: 'en' }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      const tr = data.recipe || {};
      const fields = _pickTranslatedFields(tr, recipe);
      cache[recipe.id] = fields;
      setTranslationCache(cache);
      return { ...recipe, ...fields };
    }
  } catch { /* serveur local indisponible */ }

  // 4. Essayer Gemini API si clé configurée
  const settings = typeof getSettings === 'function' ? getSettings() : {};
  if (settings.geminiApiKey) {
    try {
      const prompt = `Translate this French recipe to English. Return ONLY valid JSON with translated fields: title, description, ingredients (array), steps (array), category.\n\n${JSON.stringify({
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        category: recipe.category,
      })}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(20000),
        }
      );
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const fields = _pickTranslatedFields(parsed, recipe);
      cache[recipe.id] = fields;
      setTranslationCache(cache);
      return { ...recipe, ...fields };
    } catch (e) {
      console.warn('[Translate] Gemini échoué:', e.message);
    }
  }

  // 5. Fallback minimal : catégorie uniquement
  return {
    ...recipe,
    category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category,
  };
}

/** Extrait et valide les champs traduits pertinents. */
function _pickTranslatedFields(parsed, original) {
  return {
    title:       parsed.title       || original.title,
    description: parsed.description ?? original.description,
    ingredients: Array.isArray(parsed.ingredients) && parsed.ingredients.length
                   ? parsed.ingredients : original.ingredients,
    steps:       Array.isArray(parsed.steps) && parsed.steps.length
                   ? parsed.steps : original.steps,
    category:    parsed.category    || CATEGORY_FR_TO_EN[original.category] || original.category,
  };
}

/** Retourne les champs traduits depuis le cache (synchrone, pour les cartes). */
function getCachedTranslation(recipe) {
  if (currentLang !== 'en' || !recipe?.id) return recipe;
  const cache = getTranslationCache();
  if (cache[recipe.id]) return { ...recipe, ...cache[recipe.id] };
  // Traduction partielle synchrone : catégorie seulement
  return { ...recipe, category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category };
}

/**
 * Traduit automatiquement en arrière-plan les recettes affichées dans la grille
 * lorsque la langue est en anglais.
 */
let isTranslatingVisible = false;

async function translateVisibleRecipes(recipes) {
  if (currentLang !== 'en' || !Array.isArray(recipes) || !recipes.length) return;
  if (isTranslatingVisible) return;
  isTranslatingVisible = true;

  try {
    const cache = getTranslationCache();
    const untranslated = recipes.filter(r => r && r.id && (!cache[r.id] || !cache[r.id].title));
    if (!untranslated.length) return;

    // Traduction par lots de 3 en parallèle
    const BATCH_SIZE = 3;
    for (let i = 0; i < untranslated.length; i += BATCH_SIZE) {
      if (currentLang !== 'en') break; // arrêt si l'utilisateur a réinitialisé en FR
      const chunk = untranslated.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(async (recipe) => {
        try {
          const trans = await translateRecipeForDisplay(recipe);
          if (trans && currentLang === 'en') {
            const card = document.querySelector(`.recipe-card[data-id="${recipe.id}"]`);
            if (card) {
              const titleEl = card.querySelector('.card-title');
              if (titleEl && trans.title) titleEl.textContent = trans.title;
              const descEl = card.querySelector('.card-desc-strip');
              if (descEl && trans.description) descEl.textContent = trans.description;
              card.setAttribute('aria-label', trans.title || '');
            }
          }
        } catch (e) {
          console.warn('[translateVisibleRecipes] Erreur:', e);
        }
      }));
    }
  } finally {
    isTranslatingVisible = false;
  }
}
