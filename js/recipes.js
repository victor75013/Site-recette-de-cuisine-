/* ============================================================
   recipes.js — Affichage des recettes
   ============================================================ */

const CATEGORY_EMOJI = {
  'Entrées': '🥗',
  'Plats principaux': '🍽️',
  'Desserts': '🍰',
  'Soupes': '🍜',
  'Salades': '🥙',
  'Marinades': '🥩',
  'Sauces': '🫙',
  'Petits-déjeuners': '🥞',
  'Snacks': '🥨',
  'Boissons': '🥤',
  'Autres': '🍴',
};

function formatServings(qty, unit) {
  if (!qty || qty <= 0) return null;
  const u = unit || 'personnes';
  const icon = ['kg','g','litres','cl'].includes(u) ? '⚖️' : '👥';
  return `${icon} ${qty} ${u}`;
}

function getCategoryEmoji(category) {
  return CATEGORY_EMOJI[category] || '🍴';
}

function formatTime(minutes) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- GRILLE ----------

function renderRecipeCard(recipe) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const timeLabel = formatTime(totalTime);
  const emoji = getCategoryEmoji(recipe.category);

  const imageContent = recipe.imageUrl
    ? `<img class="card-image" src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="card-image-placeholder" style="display:none">${emoji}</div>`
    : `<div class="card-image-placeholder">${emoji}</div>`;

  const metaItems = [
    timeLabel ? `<span class="meta-item">⏱️ ${timeLabel}</span>` : '',
    recipe.author ? `<span class="meta-item">👤 ${escapeHtml(recipe.author)}</span>` : '',
    recipe.ingredients?.length ? `<span class="meta-item">🥄 ${recipe.ingredients.filter(ing => typeof ing === 'string' && !ing.trim().startsWith('#')).length} ingr.</span>` : '',
  ].filter(Boolean).join('');

  return `
    <article class="recipe-card" data-id="${recipe.id}" role="button" tabindex="0" aria-label="Voir ${escapeHtml(recipe.title)}">
      <div class="card-image-wrap">
        ${imageContent}
        <div class="card-overlay">
          ${recipe.category ? `<span class="card-category">${emoji} ${escapeHtml(recipe.category)}</span>` : ''}
          <h2 class="card-title">${escapeHtml(recipe.title)}</h2>
          ${metaItems ? `<div class="card-meta">${metaItems}</div>` : ''}
        </div>
      </div>
      ${recipe.description ? `<div class="card-desc-strip">${escapeHtml(recipe.description)}</div>` : ''}
    </article>
  `;
}


let currentAuthorFilter = '';

async function renderRecipeGrid() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="empty-state"><h3>Chargement des recettes...</h3></div>`;
  
  const allRecipes = await getAllRecipes();
  const authors = [...new Set(allRecipes.map(r => r.author).filter(Boolean))].sort();
  const categories = [...new Set(allRecipes.map(r => r.category).filter(Boolean))].sort();

  const authorTabsHtml = authors.length > 0 ? `
    <div class="author-tabs" id="author-tabs">
      <button class="author-tab active" data-author="">Toutes</button>
      ${authors.map(a => `<button class="author-tab" data-author="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join('')}
    </div>
  ` : '';

  const categoryOptions = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Mes <span>Recettes</span></h1>
      <span class="recipe-count" id="recipe-count">${allRecipes.length} recette${allRecipes.length !== 1 ? 's' : ''}</span>
    </div>

    ${authorTabsHtml}

    <div class="toolbar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input class="search-input" type="search" id="search-input" placeholder="Rechercher une recette, un ingrédient…" aria-label="Rechercher" />
      </div>
      <select class="category-select" id="category-select" aria-label="Filtrer par catégorie">
        <option value="">Toutes les catégories</option>
        ${categoryOptions}
      </select>
    </div>

    <div class="recipe-grid" id="recipe-grid"></div>
  `;

  currentAuthorFilter = '';

  document.getElementById('search-input').addEventListener('input', updateRecipeGrid);
  document.getElementById('category-select').addEventListener('change', updateRecipeGrid);

  const authorTabsContainer = document.getElementById('author-tabs');
  if (authorTabsContainer) {
    authorTabsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('author-tab')) {
        document.querySelectorAll('.author-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentAuthorFilter = e.target.dataset.author || '';
        updateRecipeGrid();
      }
    });
  }

  document.getElementById('recipe-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.recipe-card');
    if (card) openRecipeDetail(card.dataset.id);
  });

  document.getElementById('recipe-grid').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.recipe-card');
      if (card) openRecipeDetail(card.dataset.id);
    }
  });

  updateRecipeGrid();
}

async function updateRecipeGrid() {
  const grid = document.getElementById('recipe-grid');
  const countSpan = document.getElementById('recipe-count');
  if (!grid) return;

  const searchQuery = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('category-select')?.value || '';

  const allRecipes = await getAllRecipes();
  let recipes = [...allRecipes];

  if (currentAuthorFilter) recipes = recipes.filter(r => r.author === currentAuthorFilter);
  if (searchQuery) {
    recipes = recipes.filter(r =>
      r.title?.toLowerCase().includes(searchQuery) ||
      r.description?.toLowerCase().includes(searchQuery) ||
      r.category?.toLowerCase().includes(searchQuery) ||
      r.author?.toLowerCase().includes(searchQuery) ||
      r.ingredients?.some(i => i.toLowerCase().includes(searchQuery))
    );
  }
  if (categoryFilter) recipes = recipes.filter(r => r.category === categoryFilter);

  if (countSpan) countSpan.textContent = `${recipes.length} recette${recipes.length !== 1 ? 's' : ''}`;

  const emptyState = `
    <div class="empty-state">
      <div class="empty-state-icon">${searchQuery || categoryFilter || currentAuthorFilter ? '🔍' : '📭'}</div>
      <h3>${searchQuery || categoryFilter || currentAuthorFilter ? 'Aucune recette trouvée' : 'Aucune recette pour l\'instant'}</h3>
      <p>${searchQuery || categoryFilter || currentAuthorFilter ? 'Essayez d\'autres termes.' : 'Commencez par ajouter ou importer une recette.'}</p>
    </div>
  `;

  grid.innerHTML = recipes.length > 0 ? recipes.map(renderRecipeCard).join('') : emptyState;
}

// ---------- HELPERS MODE LIVRE / SIMPLISSIME ----------

function getIngredientEmoji(str) {
  if (!str) return '🥄';
  const s = str.toLowerCase();
  if (s.includes('bœuf') || s.includes('boeuf') || s.includes('steak') || s.includes('viande hachée')) return '🥩';
  if (s.includes('poulet') || s.includes('dinde') || s.includes('volaille') || s.includes('canard')) return '🍗';
  if (s.includes('porc') || s.includes('lardon') || s.includes('bacon') || s.includes('jambon') || s.includes('saucisse')) return '🥓';
  if (s.includes('poisson') || s.includes('saumon') || s.includes('thon') || s.includes('cabillaud') || s.includes('truite')) return '🐟';
  if (s.includes('crevette') || s.includes('scampi') || s.includes('gambas') || s.includes('fruit de mer')) return '🦐';
  if (s.includes('poivron')) return '🫑';
  if (s.includes('tomate')) return '🍅';
  if (s.includes('oignon') || s.includes('échalote') || s.includes('echalote')) return '🧅';
  if (s.includes('ail')) return '🧄';
  if (s.includes('gingembre')) return '🫚';
  if (s.includes('carotte')) return '🥕';
  if (s.includes('pomme de terre') || s.includes('patate')) return '🥔';
  if (s.includes('champignon')) return '🍄';
  if (s.includes('concombre') || s.includes('courgette')) return '🥒';
  if (s.includes('avocat')) return '🥑';
  if (s.includes('brocoli') || s.includes('chou')) return '🥦';
  if (s.includes('salade') || s.includes('laitue') || s.includes('épinard') || s.includes('epinard')) return '🥬';
  if (s.includes('riz')) return '🍚';
  if (s.includes('pâte') || s.includes('pate') || s.includes('spaghetti') || s.includes('nouille')) return '🍝';
  if (s.includes('fromage') || s.includes('parmesan') || s.includes('mozzarella') || s.includes('gruyère') || s.includes('comté')) return '🧀';
  if (s.includes('œuf') || s.includes('oeuf')) return '🥚';
  if (s.includes('huile') || s.includes('sésame') || s.includes('olive')) return '🍾';
  if (s.includes('soja') || s.includes('sauce') || s.includes('vinaigre')) return '🫙';
  if (s.includes('lait') || s.includes('crème') || s.includes('creme')) return '🥛';
  if (s.includes('beurre')) return '🧈';
  if (s.includes('citron')) return '🍋';
  if (s.includes('persil') || s.includes('menthe') || s.includes('coriandre') || s.includes('basilic') || s.includes('herbe')) return '🌿';
  if (s.includes('sucre') || s.includes('miel') || s.includes('sirop')) return '🍯';
  if (s.includes('sel') || s.includes('poivre') || s.includes('épice') || s.includes('epice') || s.includes('curry')) return '🧂';
  if (s.includes('farine') || s.includes('levure') || s.includes('blé')) return '🌾';
  if (s.includes('pain') || s.includes('baguette') || s.includes('mie')) return '🥖';
  if (s.includes('chocolat') || s.includes('cacao')) return '🍫';
  if (s.includes('pomme')) return '🍎';
  if (s.includes('fraise') || s.includes('framboise')) return '🍓';
  if (s.includes('banane')) return '🍌';
  if (s.includes('orange')) return '🍊';
  if (s.includes('vin') || s.includes('alcool') || s.includes('bière')) return '🍷';
  if (s.includes('eau') || s.includes('bouillon')) return '💧';
  return '🥄';
}

function splitRecipeTitle(title, description) {
  let mainTitle = title || '';
  let subtitle = '';

  if (mainTitle.includes(' - ')) {
    const parts = mainTitle.split(' - ');
    mainTitle = parts[0];
    subtitle = parts.slice(1).join(' - ');
  } else if (mainTitle.includes(' : ')) {
    const parts = mainTitle.split(' : ');
    mainTitle = parts[0];
    subtitle = parts.slice(1).join(' : ');
  } else if (mainTitle.includes(' (')) {
    const idx = mainTitle.indexOf(' (');
    subtitle = mainTitle.substring(idx + 1).replace(/\)$/, '');
    mainTitle = mainTitle.substring(0, idx);
  } else if (description && description.length < 80) {
    subtitle = description;
  }

  return { mainTitle: mainTitle.trim(), subtitle: subtitle.trim() };
}

// ---------- FICHE DÉTAIL ----------

async function openRecipeDetail(id) {
  const recipe = await getRecipeById(id);
  if (!recipe) return;

  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const viewMode = localStorage.getItem('recipe_view_mode') || 'cookbook'; // Default to cookbook mode!

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const emoji = getCategoryEmoji(recipe.category);

  // Actions d'en-tête (Bouton de bascule de vue)
  const headerActionsHtml = `
    <div class="modal-header-actions">
      <button class="view-toggle-btn" id="btn-toggle-view" title="Changer le style d'affichage">
        ${viewMode === 'cookbook' ? '🎨 Vue Classique' : '📖 Mode Livre'}
      </button>
    </div>
  `;

  if (viewMode === 'cookbook') {
    // RENDU MODE LIVRE DE CUISINE (SIMPLISSIME)
    const { mainTitle, subtitle } = splitRecipeTitle(recipe.title, recipe.description);
    
    // Ingrédients sous forme de grille visuelle
    const ingredientsGridHtml = (recipe.ingredients || []).map(ing => {
      const isHeader = typeof ing === 'string' && ing.trim().startsWith('#');
      if (isHeader) {
        const title = ing.trim().replace(/^#+\s*/, '').trim();
        return `<div class="cookbook-ing-card is-header-card">${escapeHtml(title)}</div>`;
      }
      const ingEmoji = getIngredientEmoji(ing);
      return `
        <div class="cookbook-ing-card">
          <div class="cookbook-ing-icon">${ingEmoji}</div>
          <div class="cookbook-ing-text">${escapeHtml(ing)}</div>
        </div>
      `;
    }).join('');

    // Traitement des étapes et astuces
    let stepsList = [];
    let tipText = '';
    (recipe.steps || []).forEach(step => {
      if (step.toLowerCase().startsWith('astuce') || step.toLowerCase().startsWith('conseil')) {
        tipText = step;
      } else {
        stepsList.push(step);
      }
    });

    const stepsHtml = stepsList.map((step, i) => `
      <li class="cookbook-step-item">
        <span class="cookbook-step-num">${i + 1}.</span>
        <span class="cookbook-step-text">${escapeHtml(step)}</span>
      </li>
    `).join('');

    const metaItems = [
      recipe.servings ? `<span class="cookbook-meta-item">POUR <strong>${recipe.servings} ${recipe.servingsUnit || 'PERSONNES'}</strong></span>` : '',
      recipe.prepTime ? `<span class="cookbook-meta-item">PRÉPARATION : <strong>${formatTime(recipe.prepTime)}</strong></span>` : '',
      recipe.cookTime ? `<span class="cookbook-meta-item">CUISSON : <strong>${formatTime(recipe.cookTime)}</strong></span>` : '',
    ].filter(Boolean).join(' &nbsp;•&nbsp; ');

    const imageHeader = recipe.imageUrl ? `
      <div class="detail-image-wrap" style="height:220px;">
        <img class="detail-image" src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}" onerror="this.style.display='none'" />
        <div class="detail-image-overlay"></div>
      </div>
    ` : '';

    content.innerHTML = `
      ${headerActionsHtml}
      ${imageHeader}
      <div class="cookbook-container" ${recipe.imageUrl ? 'style="margin-top:-40px;position:relative;z-index:2;"' : ''}>
        <div class="cookbook-header">
          <h2 class="cookbook-title">${escapeHtml(mainTitle)}</h2>
          ${subtitle ? `<div class="cookbook-subtitle">${escapeHtml(subtitle)}</div>` : ''}
        </div>

        ${metaItems ? `<div class="cookbook-meta-bar">${metaItems}</div>` : ''}

        ${ingredientsGridHtml ? `
          <div class="cookbook-section-title">Ingrédients (${(recipe.ingredients || []).filter(i => !i.trim().startsWith('#')).length})</div>
          <div class="cookbook-ingredients-grid">
            ${ingredientsGridHtml}
          </div>
        ` : ''}

        <div id="nutrition-container">
          ${hasValidNutrition(recipe) ? renderNutritionCard(recipe.nutrition, recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' ? recipe.servings : 0) : (getSettings().geminiApiKey && recipe.ingredients?.length ? `<div class="nutrition-loading"><span class="spinner"></span> <span>Analyse nutritionnelle en cours...</span></div>` : '')}
        </div>

        ${stepsHtml ? `
          <div class="cookbook-section-title">Préparation</div>
          <div class="cookbook-steps-box">
            <ol class="cookbook-steps-list">
              ${stepsHtml}
            </ol>
            ${tipText ? `
              <div class="cookbook-tip">
                💡 <strong>Astuce :</strong> ${escapeHtml(tipText.replace(/^(astuce|conseil)\s*:\s*/i, ''))}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${recipe.sourceUrl ? `
          <div class="detail-source" style="margin-bottom:24px;">
            Source : <a href="${escapeHtml(recipe.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(recipe.sourceUrl)}</a>
          </div>
        ` : ''}

        <div class="detail-actions">
          <button class="btn btn--secondary" id="btn-edit-recipe" data-id="${recipe.id}">✏️ Modifier</button>
          <button class="btn btn--danger" id="btn-delete-recipe" data-id="${recipe.id}">🗑️ Supprimer</button>
        </div>
      </div>
    `;

  } else {
    // RENDU MODE CLASSIQUE
    const imageSection = recipe.imageUrl
      ? `<div class="detail-image-wrap"><img class="detail-image" src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}" onerror="this.parentElement.innerHTML='<div class=\\'detail-image-placeholder\\'>${emoji}</div>'" /><div class="detail-image-overlay"></div></div>`
      : `<div class="detail-image-wrap"><div class="detail-image-placeholder">${emoji}</div></div>`;

    const actualIngredients = (recipe.ingredients || []).filter(ing => typeof ing === 'string' && !ing.trim().startsWith('#'));
    const ingredientsHtml = (recipe.ingredients || []).map(ing => {
      const isHeader = typeof ing === 'string' && ing.trim().startsWith('#');
      if (isHeader) {
        const title = ing.trim().replace(/^#+\s*/, '').trim();
        return `<li class="ingredient-item is-header">${escapeHtml(title)}</li>`;
      }
      return `<li class="ingredient-item"><span class="ingredient-dot"></span>${escapeHtml(ing)}</li>`;
    }).join('');

    const stepsHtml = (recipe.steps || []).map((step, i) =>
      `<li class="step-item"><span class="step-number">${i + 1}</span><span class="step-text">${escapeHtml(step)}</span></li>`
    ).join('');

    const badges = [
      recipe.category ? `<span class="badge badge--category">${getCategoryEmoji(recipe.category)} ${escapeHtml(recipe.category)}</span>` : '',
      recipe.author ? `<span class="badge badge--author">👤 ${escapeHtml(recipe.author)}</span>` : '',
      recipe.prepTime ? `<span class="badge badge--time">🥣 Prépa : ${formatTime(recipe.prepTime)}</span>` : '',
      recipe.cookTime ? `<span class="badge badge--time">🔥 Cuisson : ${formatTime(recipe.cookTime)}</span>` : '',
      totalTime > 0 ? `<span class="badge badge--time">⏱️ Total : ${formatTime(totalTime)}</span>` : '',
      recipe.servings ? `<span class="badge badge--servings">${formatServings(recipe.servings, recipe.servingsUnit)}</span>` : '',
    ].filter(Boolean).join('');

    content.innerHTML = `
      ${headerActionsHtml}
      ${imageSection}
      <div class="detail-body">
        <h2 class="detail-title">${escapeHtml(recipe.title)}</h2>
        <div class="detail-badges">${badges}</div>
        ${recipe.description ? `<p class="detail-description">${escapeHtml(recipe.description)}</p>` : ''}

        <div id="nutrition-container">
          <!-- Rempli asynchrone par nutrition.js -->
          ${hasValidNutrition(recipe) ? renderNutritionCard(recipe.nutrition, recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' ? recipe.servings : 0) : (getSettings().geminiApiKey && recipe.ingredients?.length ? `<div class="nutrition-loading"><span class="spinner"></span> <span>Analyse nutritionnelle en cours...</span></div>` : '')}
        </div>

        ${ingredientsHtml ? `
          <div class="detail-section">
            <h3 class="detail-section-title">🥄 Ingrédients (${actualIngredients.length})</h3>
            <ul class="ingredients-list">${ingredientsHtml}</ul>
          </div>
        ` : ''}

        ${stepsHtml ? `
          <div class="detail-section">
            <h3 class="detail-section-title">📋 Étapes de préparation</h3>
            <ol class="steps-list">${stepsHtml}</ol>
          </div>
        ` : ''}

        ${recipe.sourceUrl ? `
          <div class="detail-source">
            Source : <a href="${escapeHtml(recipe.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(recipe.sourceUrl)}</a>
          </div>
        ` : ''}

        <div class="detail-actions">
          <button class="btn btn--secondary" id="btn-edit-recipe" data-id="${recipe.id}">✏️ Modifier</button>
          <button class="btn btn--danger" id="btn-delete-recipe" data-id="${recipe.id}">🗑️ Supprimer</button>
        </div>
      </div>
    `;
  }

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Gestion du bouton de bascule de vue
  document.getElementById('btn-toggle-view')?.addEventListener('click', () => {
    const newMode = viewMode === 'cookbook' ? 'classic' : 'cookbook';
    localStorage.setItem('recipe_view_mode', newMode);
    openRecipeDetail(id);
  });

  // Lancer le chargement de la nutrition en arrière-plan
  const nutritionContainer = document.getElementById('nutrition-container');
  if (nutritionContainer && recipe.ingredients?.length) {
    // Toujours vérifier la validité au moment d'exécuter (pas depuis le cache template)
    if (hasValidNutrition(recipe)) {
      nutritionContainer.innerHTML = renderNutritionCard(recipe.nutrition, recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' ? recipe.servings : 0);
    } else {
      const settings = getSettings();
      const apiKey = (settings.geminiApiKey || '').trim();
      if (!apiKey) {
        nutritionContainer.innerHTML = `
          <div class="detail-section" style="margin-top:8px;">
            <div style="background:rgba(245,158,11,0.1);border:1px dashed rgba(245,158,11,0.5);border-radius:12px;padding:12px 16px;color:#b45309;font-size:0.85rem;">
              💡 <strong>Analyse nutritionnelle :</strong> Renseignez votre clé API Gemini dans les Paramètres.
            </div>
          </div>`;
      } else {
        nutritionContainer.innerHTML = `<div class="nutrition-loading"><span class="spinner"></span> <span>Analyse nutritionnelle en cours…</span></div>`;

        // Appel direct Gemini sans passer par getNutritionForRecipe pour éviter tout bug intermédiaire
        const realIngredients = (recipe.ingredients || []).filter(i => typeof i === 'string' && !i.trim().startsWith('#'));
        const prompt = `Tu es un nutritionniste. Calcule les valeurs nutritionnelles TOTALES pour cette recette. Ingrédients :\n${realIngredients.map(i => '- ' + i).join('\n')}\n\nRéponds UNIQUEMENT avec ce JSON (valeurs entières) :\n{"calories":0,"proteins":0,"lipids":0,"carbs":0}`;

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
        })
        .then(async res => {
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error?.message || `HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const match = text.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : JSON.parse(text);
          const nutrition = {
            calories: Math.round(Number(parsed.calories) || 0),
            proteins: Math.round(Number(parsed.proteins) || 0),
            lipids: Math.round(Number(parsed.lipids) || 0),
            carbs: Math.round(Number(parsed.carbs) || 0),
          };
          recipe.nutrition = nutrition;
          const servings = (recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions') ? (recipe.servings || 0) : 0;
          nutritionContainer.innerHTML = renderNutritionCard(nutrition, servings);

          // Sauvegarder en Firestore en arrière-plan (sans bloquer)
          if (recipe.id && typeof currentUser !== 'undefined' && currentUser) {
            db.collection('recipes').doc(recipe.id).update({ nutrition }).catch(e => console.warn('[Nutrition] Sauvegarde ignorée:', e.message));
            if (typeof cachedRecipes !== 'undefined' && cachedRecipes) {
              const cached = cachedRecipes.find(r => r.id === recipe.id);
              if (cached) cached.nutrition = nutrition;
            }
          }
        })
        .catch(err => {
          console.error('[Nutrition] Erreur:', err);
          nutritionContainer.innerHTML = `
            <div class="detail-section" style="margin-top:8px;">
              <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:12px 16px;color:#b91c1c;font-size:0.85rem;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <span>⚠️ <strong>Erreur Gemini :</strong> ${escapeHtml(err.message || 'Échec de la requête')}</span>
                <button id="btn-retry-nutrition" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:0.8rem;cursor:pointer;white-space:nowrap;">🔄 Réessayer</button>
              </div>
            </div>`;
          document.getElementById('btn-retry-nutrition')?.addEventListener('click', () => openRecipeDetail(id));
        });
      }
    }
  }

  document.getElementById('btn-edit-recipe')?.addEventListener('click', () => {
    closeModal();
    renderAddEditForm(recipe.id);
    setActiveTab('add');
  });

  document.getElementById('btn-delete-recipe')?.addEventListener('click', async () => {
    if (confirm(`Supprimer la recette "${recipe.title}" ?`)) {
      try {
        await deleteRecipe(recipe.id);
        closeModal();
        await renderRecipeGrid();
        showToast('Recette supprimée.', 'success');
      } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
      }
    }
  });
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

