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
  // English equivalents (same emoji)
  'Starters': '🥗',
  'Main courses': '🍽️',
  'Soups': '🍜',
  'Salads': '🥙',
  'Marinades': '🥩',
  'Sauces': '🫙',
  'Breakfasts': '🥞',
  'Snacks': '🥨',
  'Drinks': '🥤',
  'Others': '🍴',
};

function formatServings(qty, unit) {
  if (!qty || qty <= 0) return null;
  const u = unit || t('unit.people');
  const icon = ['kg','g','litres','cl','liters'].includes(u) ? '⚖️' : '👥';
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

  const ingCount = recipe.ingredients?.filter(ing => typeof ing === 'string' && !ing.trim().startsWith('#')).length || 0;

  const metaItems = [
    timeLabel ? `<span class="meta-item">⏱️ ${timeLabel}</span>` : '',
    recipe.author ? `<span class="meta-item">👤 ${escapeHtml(recipe.author)}</span>` : '',
    ingCount ? `<span class="meta-item">🥄 ${ingCount} ${getLang() === 'en' ? 'ingr.' : 'ingr.'}</span>` : '',
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
  app.innerHTML = `<div class="empty-state"><h3>${t('home.loading')}</h3></div>`;
  
  const allRecipes = await getAllRecipes();
  const authors = [...new Set(allRecipes.map(r => r.author).filter(Boolean))].sort();
  const categories = [...new Set(allRecipes.map(r => r.category).filter(Boolean))].sort();

  const authorTabsHtml = authors.length > 0 ? `
    <div class="author-tabs" id="author-tabs">
      <button class="author-tab active" data-author="">${t('home.all')}</button>
      ${authors.map(a => `<button class="author-tab" data-author="${escapeHtml(a)}">${escapeHtml(a)}</button>`).join('')}
    </div>
  ` : '';

  const categoryBarHtml = `
    <nav class="category-bar" id="category-bar" aria-label="Filtrer par catégorie">
      <button class="category-link ${!currentCategoryFilter ? 'active' : ''}" data-category="">${t('category.all')}</button>
      ${categories.map(c => `
        <button class="category-link ${currentCategoryFilter === c ? 'active' : ''}" data-category="${escapeHtml(c)}">
          ${escapeHtml(c.toUpperCase())}
        </button>
      `).join('')}
    </nav>
  `;

  const recipeWord = allRecipes.length <= 1 ? t('home.count.one') : t('home.count.many');

  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('home.title')} <span>${t('home.title.span')}</span></h1>
      <span class="recipe-count" id="recipe-count">${allRecipes.length} ${recipeWord}</span>
    </div>

    ${authorTabsHtml}

    <div class="toolbar">
      <div class="search-wrap">
        <input class="search-input" type="search" id="search-input" placeholder="${t('home.search')}" aria-label="${t('home.search')}" />
      </div>
    </div>

    ${categoryBarHtml}

    <div class="recipe-grid" id="recipe-grid"></div>
  `;

  currentAuthorFilter = '';
  currentCategoryFilter = '';

  document.getElementById('search-input').addEventListener('input', updateRecipeGrid);

  const categoryBar = document.getElementById('category-bar');
  if (categoryBar) {
    categoryBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-link');
      if (btn) {
        document.querySelectorAll('.category-link').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        currentCategoryFilter = btn.dataset.category || '';
        updateRecipeGrid();
      }
    });
  }

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
  const categoryFilter = currentCategoryFilter;

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

  const recipeWord = recipes.length <= 1 ? t('home.count.one') : t('home.count.many');
  if (countSpan) countSpan.textContent = `${recipes.length} ${recipeWord}`;

  const hasFilter = searchQuery || categoryFilter || currentAuthorFilter;
  const emptyState = `
    <div class="empty-state">
      <div class="empty-state-icon">${hasFilter ? '🔍' : '📭'}</div>
      <h3>${hasFilter ? t('home.noresult.title') : t('home.empty.title')}</h3>
      <p>${hasFilter ? t('home.noresult.text') : t('home.empty.text')}</p>
    </div>
  `;

  grid.innerHTML = recipes.length > 0 ? recipes.map(renderRecipeCard).join('') : emptyState;
}

// ---------- HELPERS MODE LIVRE / SIMPLISSIME ----------

function getIngredientEmoji(str) {
  if (!str) return '🥄';
  const s = str.toLowerCase();
  if (s.includes('bœuf') || s.includes('boeuf') || s.includes('beef') || s.includes('steak') || s.includes('viande hachée') || s.includes('ground beef')) return '🥩';
  if (s.includes('poulet') || s.includes('chicken') || s.includes('dinde') || s.includes('turkey') || s.includes('volaille') || s.includes('canard') || s.includes('duck')) return '🍗';
  if (s.includes('porc') || s.includes('pork') || s.includes('lardon') || s.includes('bacon') || s.includes('jambon') || s.includes('ham') || s.includes('saucisse') || s.includes('sausage')) return '🥓';
  if (s.includes('poisson') || s.includes('fish') || s.includes('saumon') || s.includes('salmon') || s.includes('thon') || s.includes('tuna') || s.includes('cabillaud') || s.includes('cod') || s.includes('truite') || s.includes('trout')) return '🐟';
  if (s.includes('crevette') || s.includes('shrimp') || s.includes('prawn') || s.includes('scampi') || s.includes('gambas') || s.includes('fruit de mer') || s.includes('seafood')) return '🦐';
  if (s.includes('poivron') || s.includes('bell pepper')) return '🫑';
  if (s.includes('tomate') || s.includes('tomato')) return '🍅';
  if (s.includes('oignon') || s.includes('onion') || s.includes('échalote') || s.includes('shallot') || s.includes('echalote')) return '🧅';
  if (s.includes('ail') || s.includes('garlic')) return '🧄';
  if (s.includes('gingembre') || s.includes('ginger')) return '🫚';
  if (s.includes('carotte') || s.includes('carrot')) return '🥕';
  if (s.includes('pomme de terre') || s.includes('patate') || s.includes('potato')) return '🥔';
  if (s.includes('champignon') || s.includes('mushroom')) return '🍄';
  if (s.includes('concombre') || s.includes('cucumber') || s.includes('courgette') || s.includes('zucchini')) return '🥒';
  if (s.includes('avocat') || s.includes('avocado')) return '🥑';
  if (s.includes('brocoli') || s.includes('broccoli') || s.includes('chou') || s.includes('cabbage')) return '🥦';
  if (s.includes('salade') || s.includes('lettuce') || s.includes('laitue') || s.includes('épinard') || s.includes('spinach') || s.includes('epinard')) return '🥬';
  if (s.includes('riz') || s.includes('rice')) return '🍚';
  if (s.includes('pâte') || s.includes('pasta') || s.includes('pate') || s.includes('spaghetti') || s.includes('nouille') || s.includes('noodle')) return '🍝';
  if (s.includes('fromage') || s.includes('cheese') || s.includes('parmesan') || s.includes('mozzarella') || s.includes('gruyère') || s.includes('comté')) return '🧀';
  if (s.includes('œuf') || s.includes('oeuf') || s.includes('egg')) return '🥚';
  if (s.includes('huile') || s.includes('oil') || s.includes('sésame') || s.includes('sesame') || s.includes('olive')) return '🍾';
  if (s.includes('soja') || s.includes('soy') || s.includes('sauce') || s.includes('vinaigre') || s.includes('vinegar')) return '🫙';
  if (s.includes('lait') || s.includes('milk') || s.includes('crème') || s.includes('cream') || s.includes('creme')) return '🥛';
  if (s.includes('beurre') || s.includes('butter')) return '🧈';
  if (s.includes('citron') || s.includes('lemon') || s.includes('lime')) return '🍋';
  if (s.includes('persil') || s.includes('parsley') || s.includes('menthe') || s.includes('mint') || s.includes('coriandre') || s.includes('coriander') || s.includes('basilic') || s.includes('basil') || s.includes('herbe') || s.includes('herb')) return '🌿';
  if (s.includes('sucre') || s.includes('sugar') || s.includes('miel') || s.includes('honey') || s.includes('sirop') || s.includes('syrup')) return '🍯';
  if (s.includes('sel') || s.includes('salt') || s.includes('poivre') || s.includes('pepper') || s.includes('épice') || s.includes('spice') || s.includes('epice') || s.includes('curry')) return '🧂';
  if (s.includes('farine') || s.includes('flour') || s.includes('levure') || s.includes('yeast') || s.includes('blé') || s.includes('wheat')) return '🌾';
  if (s.includes('pain') || s.includes('bread') || s.includes('baguette') || s.includes('mie')) return '🥖';
  if (s.includes('chocolat') || s.includes('chocolate') || s.includes('cacao') || s.includes('cocoa')) return '🍫';
  if (s.includes('pomme') || s.includes('apple')) return '🍎';
  if (s.includes('fraise') || s.includes('strawberry') || s.includes('framboise') || s.includes('raspberry')) return '🍓';
  if (s.includes('banane') || s.includes('banana')) return '🍌';
  if (s.includes('orange')) return '🍊';
  if (s.includes('vin') || s.includes('wine') || s.includes('alcool') || s.includes('alcohol') || s.includes('bière') || s.includes('beer')) return '🍷';
  if (s.includes('eau') || s.includes('water') || s.includes('bouillon') || s.includes('broth') || s.includes('stock')) return '💧';
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
  const viewMode = localStorage.getItem('recipe_view_mode') || 'cookbook';

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const emoji = getCategoryEmoji(recipe.category);

  // Actions d'en-tête (Bouton de bascule de vue)
  const headerActionsHtml = `
    <div class="modal-header-actions">
      <button class="view-toggle-btn" id="btn-toggle-view" title="Changer le style d'affichage">
        ${viewMode === 'cookbook' ? t('detail.view.classic') : t('detail.view.cookbook')}
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
      if (step.toLowerCase().startsWith('astuce') || step.toLowerCase().startsWith('conseil') || step.toLowerCase().startsWith('tip') || step.toLowerCase().startsWith('note')) {
        tipText = step;
      } else {
        stepsList.push(step);
      }
    });

    let stepNumCookbook = 1;
    const stepsHtml = stepsList.map((step) => {
      const isHeader = typeof step === 'string' && step.trim().startsWith('#');
      if (isHeader) {
        const title = step.trim().replace(/^#+\s*/, '').trim();
        return `<li class="cookbook-step-header">${escapeHtml(title)}</li>`;
      }
      const num = stepNumCookbook++;
      return `
        <li class="cookbook-step-item">
          <span class="cookbook-step-num">${num}.</span>
          <span class="cookbook-step-text">${escapeHtml(step)}</span>
        </li>
      `;
    }).join('');

    const servUnit = recipe.servingsUnit || t('unit.people');
    const metaItems = [
      recipe.servings ? `<span class="cookbook-meta-item">${t('detail.for')} <strong>${recipe.servings} ${servUnit.toUpperCase()}</strong></span>` : '',
      recipe.prepTime ? `<span class="cookbook-meta-item">${t('detail.prep')} <strong>${formatTime(recipe.prepTime)}</strong></span>` : '',
      recipe.cookTime ? `<span class="cookbook-meta-item">${t('detail.cook')} <strong>${formatTime(recipe.cookTime)}</strong></span>` : '',
    ].filter(Boolean).join(' &nbsp;•&nbsp; ');

    const imageHeader = recipe.imageUrl ? `
      <div class="detail-image-wrap" style="height:220px;">
        <img class="detail-image" src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}" onerror="this.style.display='none'" />
        <div class="detail-image-overlay"></div>
      </div>
    ` : '';

    const ingCount = (recipe.ingredients || []).filter(i => !i.trim().startsWith('#')).length;

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
          <div class="cookbook-section-title">${t('detail.ingredients')} (${ingCount})</div>
          <div class="cookbook-ingredients-grid">
            ${ingredientsGridHtml}
          </div>
        ` : ''}

        <div id="nutrition-container">
          ${hasValidNutrition(recipe) ? renderNutritionCard(recipe.nutrition, recipe.servingsUnit === t('unit.people') || recipe.servingsUnit === t('unit.portions') || recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' ? recipe.servings : 0) : (recipe.ingredients?.length ? `<div class="nutrition-loading"><span class="spinner"></span> <span>${t('detail.nutrition.analysis')}</span></div>` : '')}
        </div>

        ${stepsHtml ? `
          <div class="cookbook-section-title">${t('detail.steps')}</div>
          <div class="cookbook-steps-box">
            <ol class="cookbook-steps-list">
              ${stepsHtml}
            </ol>
            ${tipText ? `
              <div class="cookbook-tip">
                💡 <strong>${t('detail.tip')}</strong> ${escapeHtml(tipText.replace(/^(astuce|conseil|tip|note)\s*:\s*/i, ''))}
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${recipe.sourceUrl ? `
          <div class="detail-source" style="margin-bottom:24px;">
            ${t('detail.source')} <a href="${escapeHtml(recipe.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(recipe.sourceUrl)}</a>
          </div>
        ` : ''}

        <div class="detail-actions">
          <button class="btn btn--secondary" id="btn-edit-recipe" data-id="${recipe.id}">${t('detail.edit')}</button>
          <button class="btn btn--danger" id="btn-delete-recipe" data-id="${recipe.id}">${t('detail.delete')}</button>
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

    let stepNumClassic = 1;
    const stepsHtml = (recipe.steps || []).map((step) => {
      const isHeader = typeof step === 'string' && step.trim().startsWith('#');
      if (isHeader) {
        const title = step.trim().replace(/^#+\s*/, '').trim();
        return `<li class="step-item is-header">${escapeHtml(title)}</li>`;
      }
      const num = stepNumClassic++;
      return `<li class="step-item"><span class="step-number">${num}</span><span class="step-text">${escapeHtml(step)}</span></li>`;
    }).join('');

    const badges = [
      recipe.category ? `<span class="badge badge--category">${getCategoryEmoji(recipe.category)} ${escapeHtml(recipe.category)}</span>` : '',
      recipe.author ? `<span class="badge badge--author">👤 ${escapeHtml(recipe.author)}</span>` : '',
      recipe.prepTime ? `<span class="badge badge--time">${t('badge.prep')}${formatTime(recipe.prepTime)}</span>` : '',
      recipe.cookTime ? `<span class="badge badge--time">${t('badge.cook')}${formatTime(recipe.cookTime)}</span>` : '',
      totalTime > 0 ? `<span class="badge badge--time">${t('badge.total')}${formatTime(totalTime)}</span>` : '',
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
          ${hasValidNutrition(recipe) ? renderNutritionCard(recipe.nutrition, recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' || recipe.servingsUnit === t('unit.people') || recipe.servingsUnit === t('unit.portions') ? recipe.servings : 0) : (recipe.ingredients?.length ? `<div class="nutrition-loading"><span class="spinner"></span> <span>${t('detail.nutrition.analysis')}</span></div>` : '')}
        </div>

        ${ingredientsHtml ? `
          <div class="detail-section">
            <h3 class="detail-section-title">🥄 ${t('detail.ingredients')} (${actualIngredients.length})</h3>
            <ul class="ingredients-list">${ingredientsHtml}</ul>
          </div>
        ` : ''}

        ${stepsHtml ? `
          <div class="detail-section">
            <h3 class="detail-section-title">📋 ${t('detail.steps')}</h3>
            <ol class="steps-list">${stepsHtml}</ol>
          </div>
        ` : ''}

        ${recipe.sourceUrl ? `
          <div class="detail-source">
            ${t('detail.source')} <a href="${escapeHtml(recipe.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(recipe.sourceUrl)}</a>
          </div>
        ` : ''}

        <div class="detail-actions">
          <button class="btn btn--secondary" id="btn-edit-recipe" data-id="${recipe.id}">${t('detail.edit')}</button>
          <button class="btn btn--danger" id="btn-delete-recipe" data-id="${recipe.id}">${t('detail.delete')}</button>
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
    if (hasValidNutrition(recipe)) {
      nutritionContainer.innerHTML = renderNutritionCard(recipe.nutrition, recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' ? recipe.servings : 0);
    } else {
      const realIngredients = (recipe.ingredients || []).filter(i => typeof i === 'string' && !i.trim().startsWith('#'));

      if (realIngredients.length === 0) {
        nutritionContainer.innerHTML = '';
      } else {
        nutritionContainer.innerHTML = `<div class="nutrition-loading"><span class="spinner"></span> <span>${t('detail.nutrition.loading')}</span></div>`;

        const servings = (recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' || recipe.servingsUnit === t('unit.people') || recipe.servingsUnit === t('unit.portions')) ? (recipe.servings || 0) : 0;

        calculateNutritionFree(recipe.ingredients)
          .then(nutrition => {
            if (nutrition && hasValidNutrition({ nutrition })) {
              recipe.nutrition = nutrition;
              nutritionContainer.innerHTML = renderNutritionCard(nutrition, servings);
              if (recipe.id && typeof currentUser !== 'undefined' && currentUser) {
                db.collection('recipes').doc(recipe.id).update({ nutrition }).catch(e => console.warn('[Nutrition] Sauvegarde ignorée:', e.message));
                if (typeof cachedRecipes !== 'undefined' && cachedRecipes) {
                  const cached = cachedRecipes.find(r => r.id === recipe.id);
                  if (cached) cached.nutrition = nutrition;
                }
              }
            } else {
              nutritionContainer.innerHTML = `
                <div class="detail-section" style="margin-top:8px;">
                  <div style="background:rgba(245,158,11,0.1);border:1px dashed rgba(245,158,11,0.4);border-radius:12px;padding:12px 16px;color:#b45309;font-size:0.85rem;">
                    ${t('detail.nutrition.unavailable')}
                  </div>
                </div>`;
            }
          })
          .catch(err => {
            console.error('[Nutrition] Erreur finale:', err);
            nutritionContainer.innerHTML = `
              <div class="detail-section" style="margin-top:8px;">
                <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:12px 16px;color:#b91c1c;font-size:0.85rem;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                  <span>${t('detail.nutrition.error')} <strong></strong> ${escapeHtml(err.message || 'Impossible de calculer les valeurs nutritionnelles')}</span>
                  <button id="btn-retry-nutrition" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:0.8rem;cursor:pointer;white-space:nowrap;">${t('detail.nutrition.retry')}</button>
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
    if (confirm(`${t('detail.delete.confirm')} "${recipe.title}" ?`)) {
      try {
        await deleteRecipe(recipe.id);
        closeModal();
        await renderRecipeGrid();
        showToast(t('toast.deleted'), 'success');
      } catch (err) {
        showToast(t('toast.error.generic') + err.message, 'error');
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
