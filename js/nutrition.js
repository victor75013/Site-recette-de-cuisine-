/* ============================================================
   nutrition.js — Calcul automatique des valeurs nutritionnelles
   via l'API Gemini
   ============================================================ */

/**
 * Envoie la liste d'ingrédients à Gemini pour obtenir les valeurs nutritionnelles.
 * @param {string[]} ingredients - Liste des ingrédients avec quantités
 * @param {string} apiKey - Clé API Gemini
 * @returns {Promise<{calories:number, proteins:number, lipids:number, carbs:number}>}
 */
async function calculateNutrition(ingredients, apiKey) {
  // Filtrer les sous-titres (commençant par #)
  const realIngredients = ingredients.filter(ing => !ing.trim().startsWith('#'));
  if (realIngredients.length === 0) return null;

  const prompt = `Tu es un nutritionniste expert. Analyse cette liste d'ingrédients et calcule les valeurs nutritionnelles TOTALES de la recette complète.

Liste des ingrédients :
${realIngredients.map(ing => `- ${ing}`).join('\n')}

Retourne UNIQUEMENT un objet JSON avec ces 4 champs (valeurs numériques arrondies, sans unité) :
{
  "calories": <nombre total de kcal>,
  "proteins": <nombre total de grammes de protéines>,
  "lipids": <nombre total de grammes de lipides>,
  "carbs": <nombre total de grammes de glucides>
}

Règles :
- Base tes calculs sur les quantités indiquées dans les ingrédients
- Si une quantité est imprécise (ex: "un peu de sel"), estime raisonnablement
- Les valeurs doivent être pour la recette ENTIÈRE (pas par portion)
- Arrondis à l'entier le plus proche`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    throw new Error(err.error?.message || `Erreur API Gemini (${response.status})`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

  return {
    calories: Math.round(parsed.calories || 0),
    proteins: Math.round(parsed.proteins || 0),
    lipids: Math.round(parsed.lipids || 0),
    carbs: Math.round(parsed.carbs || 0),
  };
}

/**
 * Récupère ou calcule les valeurs nutritionnelles d'une recette.
 * Si elles existent déjà en base, les retourne directement.
 * Sinon, les calcule via Gemini et les sauvegarde.
 * @param {object} recipe - L'objet recette
 * @returns {Promise<{calories:number, proteins:number, lipids:number, carbs:number}|null>}
 */
async function getNutritionForRecipe(recipe) {
  // Si les valeurs existent déjà, les retourner
  if (recipe.nutrition && recipe.nutrition.calories !== undefined) {
    return recipe.nutrition;
  }

  // Vérifier qu'on a une clé API et des ingrédients
  const settings = getSettings();
  if (!settings.geminiApiKey) return null;
  if (!recipe.ingredients || recipe.ingredients.length === 0) return null;

  try {
    const nutrition = await calculateNutrition(recipe.ingredients, settings.geminiApiKey);
    if (!nutrition) return null;

    // Sauvegarder les valeurs dans Firestore pour ne pas recalculer
    if (recipe.id && currentUser) {
      await db.collection('recipes').doc(recipe.id).update({ nutrition });
      // Mettre à jour le cache local
      if (cachedRecipes) {
        const cached = cachedRecipes.find(r => r.id === recipe.id);
        if (cached) cached.nutrition = nutrition;
      }
    }

    return nutrition;
  } catch (err) {
    console.warn('[Nutrition] Erreur de calcul:', err.message);
    return null;
  }
}

/**
 * Génère le HTML de la carte nutritionnelle.
 * @param {object} nutrition - {calories, proteins, lipids, carbs}
 * @param {number} servings - Nombre de portions (0 si non défini)
 * @returns {string} HTML
 */
function renderNutritionCard(nutrition, servings) {
  if (!nutrition) return '';

  const perServing = servings > 0;
  const divider = perServing ? servings : 1;

  const items = [
    {
      icon: '🔥',
      label: 'Calories',
      total: nutrition.calories,
      unit: 'kcal',
      cssClass: 'nutrition-calories',
    },
    {
      icon: '💪',
      label: 'Protéines',
      total: nutrition.proteins,
      unit: 'g',
      cssClass: 'nutrition-proteins',
    },
    {
      icon: '🧈',
      label: 'Lipides',
      total: nutrition.lipids,
      unit: 'g',
      cssClass: 'nutrition-lipids',
    },
    {
      icon: '🌾',
      label: 'Glucides',
      total: nutrition.carbs,
      unit: 'g',
      cssClass: 'nutrition-carbs',
    },
  ];

  const itemsHtml = items
    .map(
      (item) => `
    <div class="nutrition-item ${item.cssClass}">
      <span class="nutrition-icon">${item.icon}</span>
      <span class="nutrition-value">${item.total}<span class="nutrition-unit">${item.unit}</span></span>
      <span class="nutrition-label">${item.label}</span>
      ${perServing ? `<span class="nutrition-per-serving">${Math.round(item.total / divider)} ${item.unit}/portion</span>` : ''}
    </div>
  `
    )
    .join('');

  return `
    <div class="detail-section">
      <h3 class="detail-section-title">📊 Valeurs nutritionnelles</h3>
      <div class="nutrition-card">
        <div class="nutrition-grid">${itemsHtml}</div>
        <div class="nutrition-footer">
          <span class="nutrition-hint">⚡ Estimé par IA à partir des ingrédients${perServing ? ` • ${servings} portion${servings > 1 ? 's' : ''}` : ''}</span>
        </div>
      </div>
    </div>
  `;
}
