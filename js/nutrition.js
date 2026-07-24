/* ============================================================
   nutrition.js — Calcul des valeurs nutritionnelles
   - Méthode 1 (sans clé API) : Open Food Facts (gratuit, open-source)
   - Méthode 2 (avec clé Gemini) : analyse IA des ingrédients
   ============================================================ */

// ---------- PARSING INGRÉDIENTS ----------

/** Conversion des unités vers les grammes */
const UNIT_TO_GRAMS = {
  'kg': 1000, 'kilo': 1000, 'kilos': 1000,
  'g': 1, 'gr': 1, 'gramme': 1, 'grammes': 1,
  'mg': 0.001,
  'l': 1000, 'litre': 1000, 'litres': 1000,
  'dl': 100,
  'cl': 10,
  'ml': 1,
  'cas': 15, 'cs': 15,   // cuillère à soupe ≈ 15g
  'cc': 5,  'cac': 5,    // cuillère à café ≈ 5g
  'tasse': 240, 'tasses': 240,
  'verre': 200, 'verres': 200,
  'pincée': 1, 'pincee': 1, 'pincées': 1,
  'gousse': 5, 'gousses': 5,
  'tranche': 30, 'tranches': 30,
  'feuille': 2, 'feuilles': 2,
  'botte': 80, 'bottes': 80,
  'branche': 10, 'branches': 10,
};

/** Poids estimé par pièce pour les ingrédients sans unité de poids */
const PIECE_WEIGHTS = {
  'tomate': 100, 'tomates': 100,
  'poivron': 120, 'poivrons': 120,
  'oignon': 80, 'oignons': 80,
  'échalote': 30, 'echalote': 30, 'échalotes': 30,
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
};

/**
 * Nettoie un nom d'aliment pour la recherche.
 */
function cleanFoodName(name) {
  return name
    .replace(/\(.*?\)/g, '')  // Supprime le contenu entre parenthèses
    .replace(/\b(cru|crue|crus|crues|décortiqué|décortiquée|décortiqués|émincé|émincée|haché|hachée|râpé|râpée|coupé|coupée|tranché|tranchée|frais|fraîche|fraiches|pelé|pelée|grillé|grillée|cuit|cuite)\b/gi, '')
    .replace(/\b(en morceaux|en lamelles|en dés|en julienne|en rondelles|en cubes|au four|à la poêle)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrait la quantité en grammes et le nom de l'aliment depuis une chaîne d'ingrédient.
 * @param {string} ingStr - ex: "600g de crevettes crues décortiquées"
 * @returns {{ grams: number, name: string }}
 */
function parseIngredient(ingStr) {
  const s = ingStr.trim();

  // Pattern : [nombre] [unité] [de/d'/du/des/la/le/un/une] [nom]
  // Ex: "600g de crevettes", "40 cl de lait de coco", "2 cas de curry", "3 poivrons"
  const re = /^([\d.,]+)\s*([a-zA-Zà-ÿ]+)?\s*(?:d['e']\s*|du\s*|des\s*|de\s*|la\s*|le\s*|les\s*|un\s*|une\s*)?(.*)/i;
  const m = s.match(re);

  if (m) {
    const qty = parseFloat((m[1] || '1').replace(',', '.'));
    const unitRaw = (m[2] || '').toLowerCase().replace(/[.,]+$/, '');
    const namePart = (m[3] || '').trim() || unitRaw;

    if (UNIT_TO_GRAMS[unitRaw] !== undefined) {
      // Unité reconnue → on convertit en grammes
      return { grams: qty * UNIT_TO_GRAMS[unitRaw], name: cleanFoodName(namePart || unitRaw) };
    } else {
      // Probablement des pièces (ex: "3 poivrons")
      const foodWord = unitRaw || namePart.split(' ')[0].toLowerCase();
      const pieceWeight = PIECE_WEIGHTS[foodWord] || 100;
      const name = cleanFoodName(unitRaw ? (unitRaw + ' ' + namePart).trim() : namePart);
      return { grams: qty * pieceWeight, name };
    }
  }

  // Aucune quantité trouvée → ingrédient de type "sel, poivre" → poids très faible
  return { grams: 5, name: cleanFoodName(s) };
}

// ---------- OPEN FOOD FACTS (sans clé API) ----------

/**
 * Recherche les valeurs nutritionnelles pour 100g d'un aliment sur Open Food Facts.
 * @param {string} foodName - Nom de l'aliment en français
 * @returns {Promise<{calories, proteins, lipids, carbs}|null>}
 */
async function searchOpenFoodFacts(foodName) {
  if (!foodName || foodName.length < 2) return null;

  const timeoutMs = 6000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&action=process&json=true&page_size=5&fields=product_name,nutriments&sort_by=unique_scans_n`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();
    const products = data.products || [];

    for (const product of products) {
      const n = product.nutriments;
      if (!n) continue;
      const cal = Number(n['energy-kcal_100g'] || n['energy-kcal'] || 0);
      if (cal > 0) {
        return {
          calories: cal,
          proteins: Number(n['proteins_100g'] || n['proteins'] || 0),
          lipids:   Number(n['fat_100g']      || n['fat']      || 0),
          carbs:    Number(n['carbohydrates_100g'] || n['carbohydrates'] || 0),
        };
      }
    }
    return null;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') console.warn('[OFf] Timeout pour:', foodName);
    else console.warn('[OFf] Erreur pour:', foodName, e.message);
    return null;
  }
}

/**
 * Calcule les valeurs nutritionnelles TOTALES d'une recette via Open Food Facts.
 * Aucune clé API requise.
 * @param {string[]} ingredients
 * @returns {Promise<{calories, proteins, lipids, carbs, source, foundCount, totalCount}|null>}
 */
async function calculateNutritionFree(ingredients) {
  const realIngredients = ingredients.filter(i => typeof i === 'string' && !i.trim().startsWith('#'));
  if (realIngredients.length === 0) return null;

  let totalCalories = 0, totalProteins = 0, totalLipids = 0, totalCarbs = 0;
  let foundCount = 0;

  for (const ingStr of realIngredients) {
    try {
      const { grams, name } = parseIngredient(ingStr);
      if (!name || name.length < 2) continue;

      // Utilise les 2 premiers mots significatifs pour la recherche
      const searchTerm = name.split(/\s+/).slice(0, 2).join(' ');
      const nutrients = await searchOpenFoodFacts(searchTerm);

      if (nutrients && nutrients.calories > 0) {
        const factor = grams / 100;
        totalCalories += nutrients.calories * factor;
        totalProteins += nutrients.proteins * factor;
        totalLipids   += nutrients.lipids   * factor;
        totalCarbs    += nutrients.carbs    * factor;
        foundCount++;
      }
    } catch (e) {
      console.warn('[NutritionFree] Ingrédient ignoré:', ingStr, e.message);
    }
  }

  if (foundCount === 0) return null;

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

// ---------- GEMINI (avec clé API) ----------

/**
 * Calcule les valeurs nutritionnelles via l'API Gemini.
 * @param {string[]} ingredients
 * @param {string} apiKey
 * @returns {Promise<{calories, proteins, lipids, carbs}>}
 */
async function calculateNutrition(ingredients, apiKey) {
  const realIngredients = ingredients.filter(ing => typeof ing === 'string' && !ing.trim().startsWith('#'));
  if (realIngredients.length === 0) return null;

  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) throw new Error('Clé API Gemini non définie.');

  const prompt = `Tu es un nutritionniste expert. Analyse cette liste d'ingrédients et calcule les valeurs nutritionnelles TOTALES de la recette complète.

Liste des ingrédients :
${realIngredients.map(ing => `- ${ing}`).join('\n')}

Retourne UNIQUEMENT un objet JSON avec ces 4 champs (valeurs numériques arrondies, sans unité) :
{"calories": <kcal total>, "proteins": <g total>, "lipids": <g total>, "carbs": <g total>}

Règles : Base-toi sur les quantités indiquées. Arrondis à l'entier. Valeurs pour la recette ENTIÈRE.`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erreur API Gemini ${model} (${response.status})`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const match = text.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : JSON.parse(text.replace(/```json|```/g, '').trim());

      return {
        calories: Math.round(Number(parsed.calories) || 0),
        proteins: Math.round(Number(parsed.proteins) || 0),
        lipids:   Math.round(Number(parsed.lipids)   || 0),
        carbs:    Math.round(Number(parsed.carbs)    || 0),
        source:   'gemini',
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Échec de la communication avec l'API Gemini.");
}

// ---------- HELPERS ----------

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

  // Texte de source selon la méthode utilisée
  const isOFF = nutrition.source === 'openfoodfacts';
  const foundInfo = isOFF && nutrition.foundCount < nutrition.totalCount
    ? ` • ${nutrition.foundCount}/${nutrition.totalCount} ingrédients trouvés`
    : '';
  const sourceHint = isOFF
    ? `🌿 Estimé via Open Food Facts${foundInfo}${perServing ? ` • ${servings} portion${servings > 1 ? 's' : ''}` : ''}`
    : `⚡ Estimé par IA Gemini${perServing ? ` • ${servings} portion${servings > 1 ? 's' : ''}` : ''}`;

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
