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
    recipe.ingredients?.length ? `<span class="meta-item">🥄 ${recipe.ingredients.length} ingr.</span>` : '',
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
let currentCategoryFilter = '';

async function renderRecipeGrid() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="empty-state"><h3>Chargement des recettes...</h3></div>`;
  
  const allRecipes = await getAllRecipes();
  const authors = [...new Set(allRecipes.map(r => r.author).filter(Boolean))].sort();
  const categories = [...new Set(allRecipes.map(r => r.category).filter(Boolean))].sort();

  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Mes <span>Recettes</span></h1>
      <span class="recipe-count" id="recipe-count">${allRecipes.length} recette${allRecipes.length !== 1 ? 's' : ''}</span>
    </div>

    <div class="toolbar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input class="search-input" type="search" id="search-input" placeholder="Rechercher une recette, un ingrédient…" aria-label="Rechercher" />
      </div>
      <button class="btn-filter-toggle" id="btn-filter-toggle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        Filtres
      </button>
    </div>

    <div class="recipe-grid" id="recipe-grid"></div>
  `;

  // Injecter les filtres dans la sidebar
  const filterContent = document.getElementById('filter-content');
  if (filterContent) {
    const authorOptions = authors.map(a => `<button class="filter-btn filter-author-btn ${a === currentAuthorFilter ? 'active' : ''}" data-author="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join('');
    const categoryOptions = categories.map(c => `<button class="filter-btn filter-category-btn ${c === currentCategoryFilter ? 'active' : ''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
    
    filterContent.innerHTML = `
      <details class="filter-group" open>
        <summary>Catégories</summary>
        <div class="filter-options">
          <button class="filter-btn filter-category-btn ${!currentCategoryFilter ? 'active' : ''}" data-category="">Toutes les catégories</button>
          ${categoryOptions}
        </div>
      </details>
      ${authors.length > 0 ? `
      <details class="filter-group" open>
        <summary>Auteurs</summary>
        <div class="filter-options">
          <button class="filter-btn filter-author-btn ${!currentAuthorFilter ? 'active' : ''}" data-author="">Tous les auteurs</button>
          ${authorOptions}
        </div>
      </details>
      ` : ''}
    `;

    // Événements des filtres
    filterContent.querySelectorAll('.filter-author-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterContent.querySelectorAll('.filter-author-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentAuthorFilter = e.target.dataset.author || '';
        updateRecipeGrid();
      });
    });

    filterContent.querySelectorAll('.filter-category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterContent.querySelectorAll('.filter-category-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategoryFilter = e.target.dataset.category || '';
        updateRecipeGrid();
      });
    });
  }

  // Événements toolbar
  document.getElementById('search-input')?.addEventListener('input', updateRecipeGrid);
  
  document.getElementById('btn-filter-toggle')?.addEventListener('click', openFilters);
  document.getElementById('filter-close')?.addEventListener('click', closeFilters);
  document.getElementById('filter-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'filter-overlay') closeFilters();
  });

  // Événements grille
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

  const allRecipes = await getAllRecipes();
  let recipes = [...allRecipes];

  if (currentAuthorFilter) recipes = recipes.filter(r => r.author === currentAuthorFilter);
  if (currentCategoryFilter) recipes = recipes.filter(r => r.category === currentCategoryFilter);
  if (searchQuery) {
    recipes = recipes.filter(r =>
      r.title?.toLowerCase().includes(searchQuery) ||
      r.description?.toLowerCase().includes(searchQuery) ||
      r.category?.toLowerCase().includes(searchQuery) ||
      r.author?.toLowerCase().includes(searchQuery) ||
      r.ingredients?.some(i => i.toLowerCase().includes(searchQuery))
    );
  }

  if (countSpan) countSpan.textContent = `${recipes.length} recette${recipes.length !== 1 ? 's' : ''}`;

  const emptyState = `
    <div class="empty-state">
      <div class="empty-state-icon">${searchQuery || currentCategoryFilter || currentAuthorFilter ? '🔍' : '📭'}</div>
      <h3>${searchQuery || currentCategoryFilter || currentAuthorFilter ? 'Aucune recette trouvée' : "Aucune recette pour l'instant"}</h3>
      <p>${searchQuery || currentCategoryFilter || currentAuthorFilter ? "Essayez d'autres termes ou filtres." : 'Commencez par ajouter ou importer une recette.'}</p>
    </div>
  `;

  grid.innerHTML = recipes.length > 0 ? recipes.map(renderRecipeCard).join('') : emptyState;
}

function openFilters() {
  const overlay = document.getElementById('filter-overlay');
  if (overlay) {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeFilters() {
  const overlay = document.getElementById('filter-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
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

  const ingredientsHtml = (recipe.ingredients || []).map(ing =>
    `<li class="ingredient-item"><span class="ingredient-dot"></span>${escapeHtml(ing)}</li>`
  ).join('');

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

      ${ingredientsHtml ? `
        <div class="detail-section">
          <h3 class="detail-section-title">🥄 Ingrédients (${recipe.ingredients.length})</h3>
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
