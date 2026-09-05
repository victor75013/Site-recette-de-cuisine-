/* ============================================================
   nutrition.js — Calcul des valeurs nutritionnelles
   Moteur Open Food Facts optimisé (recherche parallèle & cache persistant)
   ============================================================ */

// ---------- CACHE PERSISTANT ----------

const CACHE_KEY = 'nutrition_cache_v2';
let NUTRITION_CACHE = {};

try {
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) NUTRITION_CACHE = JSON.parse(saved);
} catch (e) {
  console.warn('[NutritionCache] Impossible de charger le cache:', e);
}

function saveNutritionCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(NUTRITION_CACHE));
  } catch (e) {
    console.warn('[NutritionCache] Erreur de sauvegarde dans localStorage:', e);
  }
}

// ---------- PARSING INGRÉDIENTS & DICTIONNAIRES ----------

/** Conversion des unités vers les grammes */
const UNIT_TO_GRAMS = {
  'kg': 1000, 'kilo': 1000, 'kilos': 1000,
  'g': 1, 'gr': 1, 'gramme': 1, 'grammes': 1,
  'mg': 0.001,
  'l': 1000, 'litre': 1000, 'litres': 1000,
  'dl': 100,
  'cl': 10,
  'ml': 1,
  'cas': 15, 'cs': 15, 'cuillere': 15, 'cuillère': 15, 'cuilleres': 15, 'cuillères': 15,
  'cc': 5, 'cac': 5,
  'tasse': 240, 'tasses': 240,
  'verre': 200, 'verres': 200, 'bol': 300, 'bols': 300,
  'pincée': 1, 'pincee': 1, 'pincées': 1, 'pincees': 1,
  'gousse': 5, 'gousses': 5,
  'tranche': 30, 'tranches': 30,
  'feuille': 2, 'feuilles': 2,
  'botte': 80, 'bottes': 80,
  'branche': 10, 'branches': 10,
  'sachet': 10, 'sachets': 10,
  'pot': 125, 'pots': 125,
  'boite': 400, 'boîte': 400, 'boites': 400, 'boîtes': 400,
};

/** Poids estimé par pièce pour les ingrédients sans unité explicite */
const PIECE_WEIGHTS = {
  'tomate': 100, 'tomates': 100,
  'poivron': 120, 'poivrons': 120,
  'oignon': 80, 'oignons': 80,
  'échalote': 30, 'echalote': 30, 'échalotes': 30, 'echalotes': 30,
  'ail': 5, 'gousse d\'ail': 5,
  'carotte': 80, 'carottes': 80,
  'pomme de terre': 150, 'pomme': 150, 'pommes': 150,
  'patate': 150, 'patates': 150,
  'courgette': 200, 'courgettes': 200,
  'aubergine': 200, 'aubergines': 200,
  'oeuf': 55, 'oeufs': 55, 'œuf': 55, 'œufs': 55,
  'citron': 80, 'citrons': 80,
  'orange': 130, 'oranges': 130,
  'banane': 120, 'bananes': 120,
  'avocat': 150, 'avocats': 150,
  'champignon': 20, 'champignons': 20,
  'concombre': 250, 'concombres': 250,
  'poire': 150, 'poires': 150,
  'pêche': 130, 'peche': 130, 'pêches': 130,
  'escalope': 150, 'escalopes': 150,
  'filet': 150, 'filets': 150,
  'steak': 150, 'steaks': 150, 'bifteck': 150,
  'pavé': 150, 'pave': 150, 'pavés': 150,
  'cuisse': 180, 'cuisses': 180,
};

/** Ingrédients à valeur nutritionnelle négligeable (0 kcal) */
const NEGLIGIBLE_INGREDIENTS = new Set([
  'eau', 'eau tiède', 'eau froide', 'eau chaude', 'eau bouillante',
  'sel', 'sel de mer', 'fleur de sel', 'gros sel', 'poivre', 'poivre noir', 'poivre blanc', 'poivre du moulin',
  'herbes de provence', 'laurier', 'feuille de laurier', 'persil', 'ciboulette', 'thym', 'origan',
  'muscade', 'noix de muscade', 'paprika', 'curcuma', 'piment', 'cannelle', 'vanille', 'glaçon', 'glaçons', 'glacon', 'glacons'
]);

/**
 * Nettoie un nom d'aliment pour améliorer la précision de recherche.
 */
function cleanFoodName(name) {
  let cleaned = name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')  // Supprime le contenu entre parenthèses
    .replace(/\b(cru|crue|crus|crues|décortiqué|décortiquée|décortiqués|émincé|émincée|émincés|haché|hachée|râpé|râpée|coupé|coupée|tranché|tranchée|frais|fraîche|fraiches|pelé|pelée|grillé|grillée|cuit|cuite|bio|maison|fondant|fondu|sec|séchée|moulu|extraraffiné)\b/gi, '')
    .replace(/\b(en morceaux|en lamelles|en dés|en julienne|en rondelles|en cubes|au four|à la poêle|de qualité|au choix|selon le goût)\b/gi, '')
    .replace(/\b(gros|grosse|petit|petite|petits|petites|moyen|moyenne)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Supprime les prépositions de début s'il en reste (ex: "d'olive" -> "olive")
  cleaned = cleaned.replace(/^(d['’]|de\s+|du\s+|des\s+|la\s+|le\s+|les\s+|un\s+|une\s+)/i, '');
  return cleaned.trim();
}

/**
 * Extrait la quantité en grammes et le nom de l'aliment depuis une chaîne d'ingrédient.
 * @param {string} ingStr - ex: "600g de crevettes crues décortiquées"
 * @returns {{ grams: number, name: string }}
 */
function parseIngredient(ingStr) {
  const s = ingStr.trim();
  if (!s) return { grams: 0, name: '' };

  // Pattern : [nombre] [unité] [de/d'/du/des/la/le/un/une] [nom]
  const re = /^([\d.,]+)\s*([a-zA-Zà-ÿ]+)?\s*(?:d['’e]\s*|du\s*|des\s*|de\s*|la\s*|le\s*|les\s*|un\s*|une\s*)?(.*)/i;
  const m = s.match(re);

  if (m) {
    const qty = parseFloat((m[1] || '1').replace(',', '.'));
    const unitRaw = (m[2] || '').toLowerCase().replace(/[.,]+$/, '');
    const namePart = (m[3] || '').trim() || unitRaw;

    if (UNIT_TO_GRAMS[unitRaw] !== undefined) {
      return { grams: qty * UNIT_TO_GRAMS[unitRaw], name: cleanFoodName(namePart || unitRaw) };
    } else {
      const foodWord = unitRaw || namePart.split(' ')[0].toLowerCase();
      const pieceWeight = PIECE_WEIGHTS[foodWord] || 100;
      const name = cleanFoodName(unitRaw ? (unitRaw + ' ' + namePart).trim() : namePart);
      return { grams: qty * pieceWeight, name };
    }
  }

  return { grams: 5, name: cleanFoodName(s) };
}

// ---------- OPEN FOOD FACTS (Moteur Optimisé) ----------

/**
 * Effectue un fetch unique avec timeout.
 */
async function fetchOFFProduct(query) {
  const timeoutMs = 4000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&action=process&json=true&page_size=5&fields=product_name,nutriments&sort_by=unique_scans_n`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    const products = data.products || [];

    for (const product of products) {
      const n = product.nutriments;
      if (!n) continue;
      
      let cal = Number(n['energy-kcal_100g'] || n['energy-kcal_value'] || n['energy-kcal'] || 0);
      if (cal === 0 && n['energy_100g']) {
        cal = Math.round(Number(n['energy_100g']) / 4.184); // Conversion kJ -> kcal
      }

      if (cal > 0) {
        return {
          calories: cal,
          proteins: Number(n['proteins_100g'] || n['proteins_value'] || n['proteins'] || 0),
          lipids:   Number(n['fat_100g']      || n['fat_value']      || n['fat']      || 0),
          carbs:    Number(n['carbohydrates_100g'] || n['carbohydrates_value'] || n['carbohydrates'] || 0),
        };
      }
    }
    return null;
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Recherche les valeurs nutritionnelles pour 100g d'un aliment (avec cache & fallback).
 * @param {string} foodName - Nom nettoyé de l'aliment
 * @returns {Promise<{calories, proteins, lipids, carbs}|null>}
 */
async function searchOpenFoodFacts(foodName) {
  if (!foodName || foodName.length < 2) return null;

  if (NEGLIGIBLE_INGREDIENTS.has(foodName)) {
    return { calories: 0, proteins: 0, lipids: 0, carbs: 0 };
  }

  // Verification dans le cache
  if (NUTRITION_CACHE[foodName] !== undefined) {
    return NUTRITION_CACHE[foodName];
  }

  // 1ère tentative : les 2 premiers mots clés
  const words = foodName.split(/\s+/).filter(Boolean);
  const term2Words = words.slice(0, 2).join(' ');
  let nutrients = await fetchOFFProduct(term2Words);

  // 2ème tentative de secours : 1er mot principal si 2 mots ont échoué
  if (!nutrients && words.length > 1) {
    const term1Word = words[0];
    if (term1Word.length > 2 && !NEGLIGIBLE_INGREDIENTS.has(term1Word)) {
      nutrients = await fetchOFFProduct(term1Word);
    }
  }

  // Sauvegarde dans le cache (même si null pour éviter les requêtes répétitives échouées)
  NUTRITION_CACHE[foodName] = nutrients;
  saveNutritionCache();

  return nutrients;
}

/**
 * Calcule les valeurs nutritionnelles TOTALES d'une recette en PARALLÈLE via Open Food Facts.
 * @param {string[]} ingredients
 * @returns {Promise<{calories, proteins, lipids, carbs, source, foundCount, totalCount}|null>}
 */
async function calculateNutritionFree(ingredients) {
  const realIngredients = (ingredients || []).filter(i => typeof i === 'string' && !i.trim().startsWith('#'));
  if (realIngredients.length === 0) return null;

  let totalCalories = 0, totalProteins = 0, totalLipids = 0, totalCarbs = 0;
  let foundCount = 0;

  // Lancement des requêtes en parallèle pour tous les ingrédients
  const results = await Promise.all(
    realIngredients.map(async (ingStr) => {
      try {
        const { grams, name } = parseIngredient(ingStr);
        if (!name || name.length < 2) return null;

        const nutrients = await searchOpenFoodFacts(name);
        if (nutrients) {
          const factor = grams / 100;
          return {
            calories: nutrients.calories * factor,
            proteins: nutrients.proteins * factor,
            lipids:   nutrients.lipids   * factor,
            carbs:    nutrients.carbs    * factor,
            isFound:  nutrients.calories > 0 || NEGLIGIBLE_INGREDIENTS.has(name)
          };
        }
      } catch (e) {
        console.warn('[Nutrition] Erreur sur ingrédient:', ingStr, e);
      }
      return null;
    })
  );

  for (const item of results) {
    if (item) {
      totalCalories += item.calories;
      totalProteins += item.proteins;
      totalLipids   += item.lipids;
      totalCarbs    += item.carbs;
      if (item.isFound) foundCount++;
    }
  }

  if (foundCount === 0 && totalCalories === 0) return null;

  return {
    calories:   Math.round(totalCalories),
    proteins:   Math.round(totalProteins),
    lipids:     Math.round(totalLipids),
    carbs:      Math.round(totalCarbs),
    source:     'openfoodfacts',
    foundCount,
    totalCount: realIngredients.length,
  };
}

// Alias pour compatibilité
const calculateNutrition = calculateNutritionFree;

// ---------- HELPERS DE RENDU ----------

/**
 * Vérifie si une recette possède des valeurs nutritionnelles valides.
 */
function hasValidNutrition(recipe) {
  if (!recipe) return false;
  const n = recipe.nutrition || recipe;
  return typeof n === 'object' && n !== null && typeof n.calories === 'number' && n.calories > 0;
}

/**
 * Génère le HTML de la carte nutritionnelle.
 * @param {object} nutrition - {calories, proteins, lipids, carbs, source?, foundCount?, totalCount?}
 * @param {number} servings - Nombre de portions (0 = pas de détail par portion)
 */
function renderNutritionCard(nutrition, servings) {
  if (!hasValidNutrition({ nutrition })) return '';

  const perServing = servings > 0;
  const divider = perServing ? servings : 1;

  const items = [
    { icon: '🔥', label: 'Calories',  total: nutrition.calories, unit: 'kcal', cssClass: 'nutrition-calories' },
    { icon: '💪', label: 'Protéines', total: nutrition.proteins, unit: 'g',    cssClass: 'nutrition-proteins' },
    { icon: '🧈', label: 'Lipides',   total: nutrition.lipids,   unit: 'g',    cssClass: 'nutrition-lipids'   },
    { icon: '🌾', label: 'Glucides',  total: nutrition.carbs,    unit: 'g',    cssClass: 'nutrition-carbs'    },
  ];

  const itemsHtml = items.map(item => `
    <div class="nutrition-item ${item.cssClass}">
      <span class="nutrition-icon">${item.icon}</span>
      <span class="nutrition-value">${item.total}<span class="nutrition-unit">${item.unit}</span></span>
      <span class="nutrition-label">${item.label}</span>
      ${perServing ? `<span class="nutrition-per-serving">${Math.round(item.total / divider)} ${item.unit}/portion</span>` : ''}
    </div>
  `).join('');

  const foundInfo = nutrition.foundCount && nutrition.totalCount && nutrition.foundCount < nutrition.totalCount
    ? ` • ${nutrition.foundCount}/${nutrition.totalCount} ingrédients identifiés`
    : '';
  const sourceHint = `🌿 Estimé via Open Food Facts${foundInfo}${perServing ? ` • ${servings} portion${servings > 1 ? 's' : ''}` : ''}`;

  return `
    <div class="detail-section">
      <h3 class="detail-section-title">📊 Valeurs nutritionnelles</h3>
      <div class="nutrition-card">
        <div class="nutrition-grid">${itemsHtml}</div>
        <div class="nutrition-footer">
          <span class="nutrition-hint">${sourceHint}</span>
        </div>
      </div>
    </div>
  `;
}
