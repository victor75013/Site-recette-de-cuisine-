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

// ---------- FICHE DÉTAIL ----------

async function openRecipeDetail(id) {
  const recipe = await getRecipeById(id);
  if (!recipe) return;

  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const emoji = getCategoryEmoji(recipe.category);

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
    ${imageSection}
    <div class="detail-body">
      <h2 class="detail-title">${escapeHtml(recipe.title)}</h2>
      <div class="detail-badges">${badges}</div>
      ${recipe.description ? `<p class="detail-description">${escapeHtml(recipe.description)}</p>` : ''}

      <div id="nutrition-container">
        <!-- Rempli asynchrone par nutrition.js -->
        ${getSettings().geminiApiKey && recipe.ingredients?.length ? `<div class="nutrition-loading"><span class="spinner"></span> <span>Analyse nutritionnelle en cours...</span></div>` : ''}
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

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Lancer le chargement de la nutrition en arrière-plan
  const nutritionContainer = document.getElementById('nutrition-container');
  if (nutritionContainer && getSettings().geminiApiKey && recipe.ingredients?.length) {
    getNutritionForRecipe(recipe).then(nutrition => {
      if (nutrition) {
        nutritionContainer.innerHTML = renderNutritionCard(nutrition, recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' ? recipe.servings : 0);
      } else {
        nutritionContainer.innerHTML = '';
      }
    });
  }

  document.getElementById('btn-edit-recipe').addEventListener('click', () => {
    closeModal();
    renderAddEditForm(recipe.id);
    setActiveTab('add');
  });

  document.getElementById('btn-delete-recipe').addEventListener('click', async () => {
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
