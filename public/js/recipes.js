/* ============================================================
   recipes.js — Affichage et gestion des recettes (ES Module)
   ============================================================ */

import { getAllRecipes, getRecipeById, deleteRecipe, currentUser, db } from './data.js';
import { t, getLang, translateCategory, getIngredientEmoji } from './i18n/index.js';
import { getCachedTranslation, translateRecipeForDisplay, clearRecipeTranslation } from './i18n/translate-recipe.js';
import { escapeHtml, formatTime, formatServings, isServingUnit, trapFocus } from './utils.js';
import { renderNutritionCard, calculateNutritionFree, hasValidNutrition, getIngredientText } from './nutrition.js';

let currentAuthorFilter = '';
let currentCategoryFilter = '';
let activeFocusTrapCleanup = null;

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
  'Starters': '🥗',
  'Main courses': '🍽️',
  'Soups': '🍜',
  'Salads': '🥙',
  'Breakfasts': '🥞',
  'Drinks': '🥤',
  'Others': '🍴'
};

export function getCategoryEmoji(category) {
  return CATEGORY_EMOJI[category] || '🍴';
}

export function renderRecipeCard(recipe) {
  const display = getCachedTranslation(recipe);
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const timeLabel = formatTime(totalTime);
  const emoji = getCategoryEmoji(recipe.category);

  const imageContent = recipe.imageUrl
    ? `<img class="card-image" src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(display.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="card-image-placeholder u-hidden">${emoji}</div>`
    : `<div class="card-image-placeholder">${emoji}</div>`;

  const ingCount = recipe.ingredients?.filter(ing => {
    const text = getIngredientText(ing);
    return text && !text.trim().startsWith('#');
  }).length || 0;

  const metaItems = [
    timeLabel ? `<span class="meta-item">⏱️ ${timeLabel}</span>` : '',
    recipe.author ? `<span class="meta-item">👤 ${escapeHtml(recipe.author)}</span>` : '',
    ingCount ? `<span class="meta-item">🥄 ${ingCount} ingr.</span>` : '',
  ].filter(Boolean).join('');

  return `
    <article class="recipe-card" data-id="${escapeHtml(recipe.id)}" role="button" tabindex="0" aria-label="${escapeHtml(display.title)}">
      <div class="card-image-wrap">
        ${imageContent}
        <div class="card-overlay">
          ${display.category ? `<span class="card-category">${emoji} ${escapeHtml(display.category)}</span>` : ''}
          <h2 class="card-title">${escapeHtml(display.title)}</h2>
          ${metaItems ? `<div class="card-meta">${metaItems}</div>` : ''}
        </div>
      </div>
      ${display.description ? `<div class="card-desc-strip">${escapeHtml(display.description)}</div>` : ''}
    </article>
  `;
}

export async function renderRecipeGrid() {
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
          ${escapeHtml(translateCategory(c).toUpperCase())}
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

  document.getElementById('search-input')?.addEventListener('input', updateRecipeGrid);

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
      const btn = e.target.closest('.author-tab');
      if (btn) {
        document.querySelectorAll('.author-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        currentAuthorFilter = btn.dataset.author || '';
        updateRecipeGrid();
      }
    });
  }

  const recipeGrid = document.getElementById('recipe-grid');
  if (recipeGrid) {
    recipeGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.recipe-card');
      if (card && card.dataset.id) openRecipeDetail(card.dataset.id);
    });

    recipeGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.recipe-card');
        if (card && card.dataset.id) {
          e.preventDefault();
          openRecipeDetail(card.dataset.id);
        }
      }
    });
  }

  updateRecipeGrid();
}

export async function updateRecipeGrid() {
  const grid = document.getElementById('recipe-grid');
  const countSpan = document.getElementById('recipe-count');
  if (!grid) return;

  const searchQuery = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const allRecipes = await getAllRecipes();

  const filtered = allRecipes.filter(r => {
    if (currentAuthorFilter && r.author !== currentAuthorFilter) return false;
    if (currentCategoryFilter && r.category !== currentCategoryFilter) return false;
    if (!searchQuery) return true;

    const display = getCachedTranslation(r);
    const inTitle = (display.title || '').toLowerCase().includes(searchQuery);
    const inDesc = (display.description || '').toLowerCase().includes(searchQuery);
    const inIngr = (r.ingredients || []).some(i => getIngredientText(i).toLowerCase().includes(searchQuery));
    return inTitle || inDesc || inIngr;
  });

  if (countSpan) {
    const word = filtered.length <= 1 ? t('home.count.one') : t('home.count.many');
    countSpan.textContent = `${filtered.length} ${word}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state u-text-center" style="grid-column: 1 / -1; padding: 60px 20px;">
        <h3>${searchQuery ? t('home.noresult.title') : t('home.empty.title')}</h3>
        <p class="u-text-muted u-mt-sm">${searchQuery ? t('home.noresult.text') : t('home.empty.text')}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(r => renderRecipeCard(r)).join('');
}

export function splitRecipeTitle(title, description = '') {
  let mainTitle = title || '';
  let subtitle = '';

  if (mainTitle.includes(' : ')) {
    const parts = mainTitle.split(' : ');
    mainTitle = parts[0];
    subtitle = parts.slice(1).join(' : ');
  } else if (mainTitle.includes(' - ')) {
    const parts = mainTitle.split(' - ');
    mainTitle = parts[0];
    subtitle = parts.slice(1).join(' - ');
  } else if (description && description.length < 80) {
    subtitle = description;
  }

  return { mainTitle: mainTitle.trim(), subtitle: subtitle.trim() };
}

// ─── RENDU DU MODE LIVRE DE CUISINE (Point 7) ───
export function renderCookbookView(recipe, display, headerActionsHtml) {
  const { mainTitle, subtitle } = splitRecipeTitle(display.title, display.description);

  const ingredientsGridHtml = (display.ingredients || []).map(ing => {
    const text = getIngredientText(ing);
    const isHeader = text.trim().startsWith('#');
    if (isHeader) {
      return `<div class="cookbook-ing-card is-header-card">${escapeHtml(text.replace(/^#+\s*/, ''))}</div>`;
    }
    const ingEmoji = getIngredientEmoji(ing);
    return `
      <div class="cookbook-ing-card">
        <div class="cookbook-ing-icon">${ingEmoji}</div>
        <div class="cookbook-ing-text">${escapeHtml(text)}</div>
      </div>
    `;
  }).join('');

  let stepNum = 1;
  let tipText = '';
  const stepsList = [];
  (display.steps || []).forEach(step => {
    const text = typeof step === 'string' ? step : '';
    if (/^(astuce|conseil|tip|note)/i.test(text.trim())) {
      tipText = text;
    } else {
      stepsList.push(step);
    }
  });
  const stepsHtml = stepsList.map(step => {
    const isHeader = typeof step === 'string' && step.trim().startsWith('#');
    if (isHeader) {
      return `<li class="cookbook-step-header">${escapeHtml(step.replace(/^#+\s*/, ''))}</li>`;
    }
    return `
      <li class="cookbook-step-item">
        <span class="cookbook-step-num">${stepNum++}.</span>
        <span class="cookbook-step-text">${escapeHtml(step)}</span>
      </li>
    `;
  }).join('');

  const servUnit = display.servingsUnit || t('unit.people');
  const totalTime = (display.prepTime || 0) + (display.cookTime || 0);
  const metaItems = [
    display.category ? `<span class="cookbook-meta-item cookbook-meta-item--category"><strong>${getCategoryEmoji(display.category)} ${escapeHtml(display.category)}</strong></span>` : '',
    display.servings ? `<span class="cookbook-meta-item">${t('detail.for')} <strong>${display.servings} ${servUnit.toUpperCase()}</strong></span>` : '',
    display.prepTime ? `<span class="cookbook-meta-item">${t('detail.prep')} <strong>${formatTime(display.prepTime)}</strong></span>` : '',
    display.cookTime ? `<span class="cookbook-meta-item">${t('detail.cook')} <strong>${formatTime(display.cookTime)}</strong></span>` : '',
    totalTime ? `<span class="cookbook-meta-item">${t('badge.total')} <strong>${formatTime(totalTime)}</strong></span>` : '',
    display.author ? `<span class="cookbook-meta-item">${t('detail.by')} <strong>${escapeHtml(display.author)}</strong></span>` : '',
  ].filter(Boolean).join(' &nbsp;•&nbsp; ');
  const ingCount = (display.ingredients || []).filter(ingredient => {
    const text = getIngredientText(ingredient);
    return text && !text.trim().startsWith('#');
  }).length;

  return `
    ${headerActionsHtml}
    ${display.imageUrl ? `
      <div class="detail-image-wrap" style="height:220px;">
        <img class="detail-image" src="${escapeHtml(display.imageUrl)}" alt="${escapeHtml(display.title)}" onerror="this.style.display='none'" />
        <div class="detail-image-overlay"></div>
      </div>
    ` : ''}
    <div class="cookbook-container" ${display.imageUrl ? 'style="margin-top:-40px;position:relative;z-index:2;"' : ''}>
      <div class="cookbook-header">
        <h2 class="cookbook-title" id="modal-title">${escapeHtml(mainTitle)}</h2>
        ${subtitle ? `<div class="cookbook-subtitle">${escapeHtml(subtitle)}</div>` : ''}
      </div>
      ${display.description && subtitle !== display.description ? `<p class="cookbook-description">${escapeHtml(display.description)}</p>` : ''}
      ${metaItems ? `<div class="cookbook-meta-bar">${metaItems}</div>` : ''}

      ${ingredientsGridHtml ? `
        <div class="cookbook-section-title">${t('detail.ingredients')} (${ingCount})</div>
        <div class="cookbook-ingredients-grid">${ingredientsGridHtml}</div>
      ` : ''}

      <div id="nutrition-container">
        ${hasValidNutrition(recipe) ? renderNutritionCard(recipe.nutrition, recipe.servingsUnit === 'personnes' || recipe.servingsUnit === 'portions' ? recipe.servings : 0) : (recipe.ingredients?.length ? `<div class="nutrition-loading"><span class="spinner"></span> <span>${t('detail.nutrition.analysis')}</span></div>` : '')}
      </div>

      ${stepsHtml ? `
        <div class="cookbook-section-title">${t('detail.steps')}</div>
        <div class="cookbook-steps-box">
          <ol class="cookbook-steps-list">${stepsHtml}</ol>
          ${tipText ? `
            <div class="cookbook-tip">
              💡 <strong>${t('detail.tip')}</strong> ${escapeHtml(tipText.replace(/^(astuce|conseil|tip|note)\s*:\s*/i, ''))}
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${display.sourceUrl ? `
        <div class="detail-source" style="margin-bottom:24px;">
          ${t('detail.source')} <a href="${escapeHtml(display.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(display.sourceUrl)}</a>
        </div>
      ` : ''}

      <div class="detail-actions">
        <button class="btn btn--secondary" id="btn-edit-recipe" data-id="${escapeHtml(recipe.id)}">${t('detail.edit')}</button>
        <button class="btn btn--danger" id="btn-delete-recipe" data-id="${escapeHtml(recipe.id)}">${t('detail.delete')}</button>
      </div>
    </div>
  `;
}

// ─── RENDU DU MODE CLASSIQUE (Point 7) ───
export function renderClassicView(recipe, display, headerActionsHtml) {
  const emoji = getCategoryEmoji(recipe.category);
  const totalTime = (display.prepTime || 0) + (display.cookTime || 0);

  const imageSection = display.imageUrl
    ? `<div class="detail-image-wrap"><img class="detail-image" src="${escapeHtml(display.imageUrl)}" alt="${escapeHtml(display.title)}" onerror="this.parentElement.innerHTML='<div class=\\'detail-image-placeholder\\'>${emoji}</div>'" /></div>`
    : `<div class="detail-image-wrap"><div class="detail-image-placeholder">${emoji}</div></div>`;

  const ingredientsHtml = (display.ingredients || []).map(ing => {
    const text = getIngredientText(ing);
    const isHeader = text.trim().startsWith('#');
    if (isHeader) {
      return `<li class="ingredient-item is-header">${escapeHtml(text.replace(/^#+\s*/, ''))}</li>`;
    }
    return `<li class="ingredient-item"><span class="ingredient-dot"></span>${escapeHtml(text)}</li>`;
  }).join('');

  let stepNum = 1;
  const stepsHtml = (display.steps || []).map(step => {
    const isHeader = typeof step === 'string' && step.trim().startsWith('#');
    if (isHeader) {
      return `<li class="step-item is-header">${escapeHtml(step.replace(/^#+\s*/, ''))}</li>`;
    }
    return `<li class="step-item"><span class="step-number">${stepNum++}</span><span class="step-text">${escapeHtml(step)}</span></li>`;
  }).join('');

  const badges = [
    display.category ? `<span class="badge badge--category">${emoji} ${escapeHtml(display.category)}</span>` : '',
    display.author ? `<span class="badge badge--author">👤 ${escapeHtml(display.author)}</span>` : '',
    display.prepTime ? `<span class="badge badge--time">${t('badge.prep')}${formatTime(display.prepTime)}</span>` : '',
    display.cookTime ? `<span class="badge badge--time">${t('badge.cook')}${formatTime(display.cookTime)}</span>` : '',
    totalTime > 0 ? `<span class="badge badge--time">${t('badge.total')}${formatTime(totalTime)}</span>` : '',
    display.servings ? `<span class="badge badge--servings">${formatServings(display.servings, display.servingsUnit)}</span>` : '',
  ].filter(Boolean).join('');

  return `
    ${headerActionsHtml}
    ${imageSection}
    <div class="detail-body">
      <h2 class="detail-title" id="modal-title">${escapeHtml(display.title)}</h2>
      <div class="detail-badges">${badges}</div>
      ${display.description ? `<p class="detail-description">${escapeHtml(display.description)}</p>` : ''}

      <div id="nutrition-container"></div>

      ${ingredientsHtml ? `
        <div class="detail-section">
          <h3 class="detail-section-title">${t('detail.ingredients')}</h3>
          <ul class="ingredients-list">${ingredientsHtml}</ul>
        </div>
      ` : ''}

      ${stepsHtml ? `
        <div class="detail-section">
          <h3 class="detail-section-title">${t('detail.steps')}</h3>
          <ol class="steps-list">${stepsHtml}</ol>
        </div>
      ` : ''}

      <div class="detail-actions">
        <button class="btn btn--secondary" id="btn-edit-recipe" data-id="${escapeHtml(recipe.id)}">${t('detail.edit')}</button>
        <button class="btn btn--danger" id="btn-delete-recipe" data-id="${escapeHtml(recipe.id)}">${t('detail.delete')}</button>
      </div>
    </div>
  `;
}

// ─── CHARGEMENT DE LA NUTRITION (Point 7) ───
export async function loadNutrition(recipe, container) {
  if (!container || !recipe.ingredients?.length) return;

  const servings = isServingUnit(recipe.servingsUnit) ? (recipe.servings || 0) : 0;

  if (hasValidNutrition(recipe)) {
    container.innerHTML = renderNutritionCard(recipe.nutrition, servings);
    return;
  }

  container.innerHTML = `<div class="nutrition-loading"><span class="spinner"></span> <span>${t('detail.nutrition.loading')}</span></div>`;

  try {
    const nutrition = await calculateNutritionFree(recipe.ingredients);
    if (nutrition && hasValidNutrition({ nutrition })) {
      recipe.nutrition = nutrition;
      container.innerHTML = renderNutritionCard(nutrition, servings);
      if (recipe.id && currentUser) {
        db.collection('recipes').doc(recipe.id).update({ nutrition }).catch(() => {});
      }
    } else {
      container.innerHTML = `<div class="u-text-dim u-mt-sm" style="font-size:0.85rem;">${t('detail.nutrition.unavailable')}</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div class="u-text-danger u-mt-sm" style="font-size:0.85rem;">${t('detail.nutrition.error')} ${escapeHtml(err.message)}</div>`;
  }
}

// ─── OUVERTURE DÉTAIL DÉCOUPLÉE & ACCESSIBLE (Points 7 et 28) ───
export async function openRecipeDetail(id) {
  const recipe = await getRecipeById(id);
  if (!recipe) return;

  const app = document.getElementById('app');
  if (!app) return;

  const displayRecipe = await translateRecipeForDisplay(recipe);
  const viewMode = localStorage.getItem('recipe_view_mode') || 'cookbook';

  const headerActionsHtml = `
    <div class="modal-header-actions" style="display:flex;justify-content:flex-end;margin-bottom:12px;">
      <button class="btn btn--sm btn--secondary" id="btn-toggle-view" title="Changer le style d'affichage">
        ${viewMode === 'cookbook' ? t('detail.view.classic') : t('detail.view.cookbook')}
      </button>
    </div>
  `;

  app.innerHTML = `
    <div class="recipe-detail-page">
      <button class="recipe-back-btn" id="btn-back-recipes" type="button">
        <span aria-hidden="true">←</span> ${t('detail.back')}
      </button>
      <article class="recipe-detail-card">
        ${viewMode === 'cookbook'
          ? renderCookbookView(recipe, displayRecipe, headerActionsHtml)
          : renderClassicView(recipe, displayRecipe, headerActionsHtml)}
      </article>
    </div>
  `;

  // Bascule de vue
  document.getElementById('btn-toggle-view')?.addEventListener('click', () => {
    const newMode = viewMode === 'cookbook' ? 'classic' : 'cookbook';
    localStorage.setItem('recipe_view_mode', newMode);
    openRecipeDetail(id);
  });

  // Chargement nutrition asynchrone
  const nutritionContainer = document.getElementById('nutrition-container');
  if (nutritionContainer) {
    loadNutrition(recipe, nutritionContainer);
  }

  // Événements d'édition et suppression
  document.getElementById('btn-edit-recipe')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'add', editId: recipe.id } }));
  });

  document.getElementById('btn-back-recipes')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'home' } }));
  });

  document.getElementById('btn-delete-recipe')?.addEventListener('click', async () => {
    if (confirm(`${t('detail.delete.confirm')} "${displayRecipe.title}" ?`)) {
      try {
        clearRecipeTranslation(recipe.id);
        await deleteRecipe(recipe.id);
        await renderRecipeGrid();
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('toast.deleted'), type: 'success' } }));
      } catch (err) {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('toast.error.generic') + err.message, type: 'error' } }));
      }
    }
  });
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
  if (activeFocusTrapCleanup) {
    activeFocusTrapCleanup();
    activeFocusTrapCleanup = null;
  }
}
