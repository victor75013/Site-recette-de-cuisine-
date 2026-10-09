/* ============================================================
   form.js — Formulaire d'ajout / modification de recette
   ============================================================ */

const CATEGORIES_FR = [
  'Entrées', 'Plats principaux', 'Desserts', 'Soupes',
  'Salades', 'Marinades', 'Sauces', 'Petits-déjeuners',
  'Snacks', 'Boissons', 'Autres',
];

const CATEGORIES_EN = [
  'Starters', 'Main courses', 'Desserts', 'Soups',
  'Salads', 'Marinades', 'Sauces', 'Breakfasts',
  'Snacks', 'Drinks', 'Others',
];

function getCategories() {
  return getLang() === 'en' ? CATEGORIES_EN : CATEGORIES_FR;
}

function getServingsUnits() {
  return [
    { value: 'personnes', label: t('unit.people')   },
    { value: 'portions',  label: t('unit.portions') },
    { value: 'pièces',    label: t('unit.pieces')   },
    { value: 'kg',        label: t('unit.kg')       },
    { value: 'g',         label: t('unit.g')        },
    { value: 'litres',    label: t('unit.liters')   },
    { value: 'cl',        label: t('unit.cl')       },
  ];
}

async function renderAddEditForm(editId = null, prefill = null) {
  const app    = document.getElementById('app');
  app.innerHTML = `<div class="empty-state"><h3>${t('form.loading')}</h3></div>`;
  
  const recipe = editId ? await getRecipeById(editId) : null;
  const data   = recipe || prefill || {};
  const isEdit = !!recipe;

  const allRecipes = await getAllRecipes();
  const authors = [...new Set(allRecipes.map(r => r.author).filter(Boolean))].sort();

  const CATEGORIES = getCategories();
  const SERVINGS_UNITS = getServingsUnits();

  const categoryOptions = CATEGORIES.map(c =>
    `<option value="${c}" ${data.category === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  const ingredients = data.ingredients?.length ? data.ingredients : [''];
  const steps = data.steps?.length ? data.steps : [''];

  app.innerHTML = `
    <h1 class="form-page-title">${isEdit ? t('form.edit.title') : t('form.new.title')}</h1>

    <form class="form-card" id="recipe-form" novalidate>
      <input type="hidden" id="recipe-id" value="${isEdit ? escapeHtml(recipe.id) : ''}" />

      <div class="form-grid">
        <!-- Titre -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-title">${t('form.title.label')} <span>*</span></label>
          <input class="form-input" id="f-title" type="text" required
                 placeholder="${t('form.title.placeholder')}"
                 value="${escapeHtml(data.title || '')}" />
        </div>

        <!-- Catégorie -->
        <div class="form-group">
          <label class="form-label" for="f-category">${t('form.category.label')}</label>
          <select class="form-select" id="f-category">
            <option value="">${t('form.category.choose')}</option>
            ${categoryOptions}
          </select>
        </div>

        <!-- Auteur -->
        <div class="form-group">
          <label class="form-label" for="f-author">${t('form.author.label')}</label>
          <input class="form-input" id="f-author" type="text" list="author-list"
                 placeholder="${t('form.author.placeholder')}"
                 value="${escapeHtml(data.author || '')}" />
          <datalist id="author-list">
            ${authors.map(a => `<option value="${escapeHtml(a)}"></option>`).join('')}
          </datalist>
        </div>

        <!-- Quantité -->
        <div class="form-group">
          <label class="form-label" for="f-servings">${t('form.qty.label')}</label>
          <div style="display:flex; gap:8px;">
            <input class="form-input" id="f-servings" type="number" min="0" step="any"
                   placeholder="${t('form.qty.placeholder')}"
                   value="${data.servings || ''}" style="flex:1; min-width:0;" />
            <select class="form-select" id="f-servings-unit" style="flex:1; min-width:0;">
              ${SERVINGS_UNITS.map(u =>
                `<option value="${u.value}" ${(data.servingsUnit || 'personnes') === u.value ? 'selected' : ''}>${u.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- Temps prépa -->
        <div class="form-group">
          <label class="form-label" for="f-prep">${t('form.prep.label')}</label>
          <input class="form-input" id="f-prep" type="number" min="0"
                 placeholder="${t('form.prep.placeholder')}"
                 value="${data.prepTime || ''}" />
        </div>

        <!-- Temps cuisson -->
        <div class="form-group">
          <label class="form-label" for="f-cook">${t('form.cook.label')}</label>
          <input class="form-input" id="f-cook" type="number" min="0"
                 placeholder="${t('form.cook.placeholder')}"
                 value="${data.cookTime || ''}" />
        </div>

        <!-- Description -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-description">${t('form.desc.label')}</label>
          <textarea class="form-textarea" id="f-description"
                    placeholder="${t('form.desc.placeholder')}">${escapeHtml(data.description || '')}</textarea>
        </div>

        <!-- Image URL -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-image">${t('form.image.label')}</label>
          <input class="form-input" id="f-image" type="url"
                 placeholder="https://exemple.com/image.jpg"
                 value="${escapeHtml(data.imageUrl || '')}" />
        </div>

        <!-- Source URL -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-source">${t('form.source.label')}</label>
          <input class="form-input" id="f-source" type="url"
                 placeholder="https://site-recette.fr/..."
                 value="${escapeHtml(data.sourceUrl || '')}" />
        </div>
      </div>

      <hr class="form-divider" />

      <!-- INGRÉDIENTS -->
      <div class="form-section-title">${t('form.ingredients.title')}</div>
      <div class="dynamic-list" id="ingredients-list">
        ${ingredients.map((ing, i) => renderIngredientRow(ing, i)).join('')}
      </div>
      <div style="display:flex; gap:12px; margin-top:8px;">
        <button type="button" class="btn btn--add-item" id="btn-add-ingredient" style="margin-top:0; flex:1;">
          ${t('form.add.ingredient')}
        </button>
        <button type="button" class="btn btn--add-item" id="btn-add-section" style="margin-top:0; flex:1; background:rgba(245,158,11,0.05); border-color:rgba(245,158,11,0.4); color:var(--accent);">
          ${t('form.add.section')}
        </button>
      </div>

      <hr class="form-divider" />

      <!-- ÉTAPES -->
      <div class="form-section-title">${t('form.steps.title')}</div>
      <div class="dynamic-list" id="steps-list">
        ${steps.map((step, i) => renderStepRow(step, i)).join('')}
      </div>
      <div style="display:flex; gap:12px; margin-top:8px;">
        <button type="button" class="btn btn--add-item" id="btn-add-step" style="margin-top:0; flex:1;">
          ${t('form.add.step')}
        </button>
        <button type="button" class="btn btn--add-section" id="btn-add-step-section" style="margin-top:0; flex:1; background:rgba(245,158,11,0.05); border-color:rgba(245,158,11,0.4); color:var(--accent);">
          ${t('form.add.section')}
        </button>
      </div>

      <hr class="form-divider" />

      <!-- ACTIONS -->
      <div class="form-actions">
        <button type="button" class="btn btn--secondary" id="btn-cancel-form">${t('form.cancel')}</button>
        <button type="submit" class="btn btn--primary" id="btn-save-recipe">
          💾 ${isEdit ? t('form.save.edit').replace('💾 ', '') : t('form.save.new').replace('💾 ', '')}
        </button>
      </div>
    </form>
  `;

  bindFormEvents(isEdit);
}

function renderIngredientRow(value = '', index) {
  const trimmedValue = value.trim();
  const isHeader = trimmedValue.startsWith('#');
  const displayValue = isHeader ? trimmedValue.replace(/^#+\s*/, '').trim() : value;
  return `
    <div class="dynamic-item ingredient-row ${isHeader ? 'is-header' : ''}" data-index="${index}">
      <button type="button" class="btn-toggle-header" title="${isHeader ? 'Convertir en ingrédient' : 'Convertir en sous-partie (titre)'}" aria-label="${isHeader ? 'Convertir en sous-partie' : 'Convertir en sous-partie'}">
        ${isHeader ? '🏷️' : '🥄'}
      </button>
      <input class="form-input dynamic-item-input ingredient-input"
             type="text"
             placeholder="${isHeader ? t('form.ing.placeholder.header') : t('form.ing.placeholder.item')}"
             value="${escapeHtml(displayValue)}" />
      <button type="button" class="dynamic-item-remove" title="Supprimer" aria-label="Supprimer cet ingrédient">✕</button>
    </div>
  `;
}

function renderStepRow(value = '', index) {
  const trimmedValue = value.trim();
  const isHeader = trimmedValue.startsWith('#');
  const displayValue = isHeader ? trimmedValue.replace(/^#+\s*/, '').trim() : value;
  return `
    <div class="dynamic-item step-row ${isHeader ? 'is-header' : ''}" data-index="${index}">
      <button type="button" class="btn-toggle-header btn-toggle-step-header" title="${isHeader ? 'Convertir en étape' : 'Convertir en sous-partie (titre)'}" aria-label="${isHeader ? 'Convertir en étape' : 'Convertir en sous-partie'}">
        ${isHeader ? '🏷️' : '📋'}
      </button>
      <span class="step-number-badge" ${isHeader ? 'style="display:none;"' : ''}>${index + 1}</span>
      <textarea class="form-textarea dynamic-item-input step-input list-textarea"
                placeholder="${isHeader ? t('form.step.placeholder.header') : t('form.step.placeholder.item')}">${escapeHtml(displayValue)}</textarea>
      <button type="button" class="dynamic-item-remove" title="Supprimer" aria-label="Supprimer cette étape">✕</button>
    </div>
  `;
}

function refreshStepNumbers() {
  let stepNum = 1;
  document.querySelectorAll('#steps-list .dynamic-item').forEach((row) => {
    const badge = row.querySelector('.step-number-badge');
    const toggleBtn = row.querySelector('.btn-toggle-step-header');
    const isHeader = row.classList.contains('is-header');
    if (badge) {
      if (isHeader) {
        badge.style.display = 'none';
      } else {
        badge.style.display = 'flex';
        badge.textContent = stepNum++;
      }
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = isHeader ? '🏷️' : '📋';
      toggleBtn.title = isHeader ? 'Convertir en étape' : 'Convertir en sous-partie (titre)';
    }
  });
}

function bindFormEvents(isEdit) {
  document.getElementById('btn-add-ingredient').addEventListener('click', () => {
    const list = document.getElementById('ingredients-list');
    const count = list.querySelectorAll('.dynamic-item').length;
    list.insertAdjacentHTML('beforeend', renderIngredientRow('', count));
    list.lastElementChild.querySelector('input').focus();
  });

  document.getElementById('btn-add-section').addEventListener('click', () => {
    const list = document.getElementById('ingredients-list');
    const count = list.querySelectorAll('.dynamic-item').length;
    list.insertAdjacentHTML('beforeend', renderIngredientRow('# ', count));
    list.lastElementChild.querySelector('input').focus();
  });

  document.getElementById('btn-add-step').addEventListener('click', () => {
    const list = document.getElementById('steps-list');
    const count = list.querySelectorAll('.dynamic-item').length;
    list.insertAdjacentHTML('beforeend', renderStepRow('', count));
    refreshStepNumbers();
    list.lastElementChild.querySelector('textarea').focus();
  });

  document.getElementById('btn-add-step-section')?.addEventListener('click', () => {
    const list = document.getElementById('steps-list');
    const count = list.querySelectorAll('.dynamic-item').length;
    list.insertAdjacentHTML('beforeend', renderStepRow('# ', count));
    refreshStepNumbers();
    list.lastElementChild.querySelector('textarea').focus();
  });

  document.getElementById('ingredients-list').addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.btn-toggle-header');
    if (toggleBtn) {
      const row = toggleBtn.closest('.dynamic-item');
      const input = row.querySelector('.ingredient-input');
      const isHeader = row.classList.toggle('is-header');
      
      if (isHeader) {
        toggleBtn.innerHTML = '🏷️';
        toggleBtn.title = 'Convertir en ingrédient';
        toggleBtn.setAttribute('aria-label', 'Convertir en ingrédient');
        input.placeholder = t('form.ing.placeholder.header');
      } else {
        toggleBtn.innerHTML = '🥄';
        toggleBtn.title = 'Convertir en sous-partie (titre)';
        toggleBtn.setAttribute('aria-label', 'Convertir en sous-partie');
        input.placeholder = t('form.ing.placeholder.item');
      }
      return;
    }

    if (e.target.classList.contains('dynamic-item-remove')) {
      const list = document.getElementById('ingredients-list');
      if (list.querySelectorAll('.dynamic-item').length > 1) {
        e.target.closest('.dynamic-item').remove();
      } else {
        const row = e.target.closest('.dynamic-item');
        row.querySelector('input').value = '';
        row.classList.remove('is-header');
        const toggle = row.querySelector('.btn-toggle-header');
        if (toggle) {
          toggle.innerHTML = '🥄';
          toggle.title = 'Convertir en sous-partie (titre)';
          toggle.setAttribute('aria-label', 'Convertir en sous-partie');
        }
      }
    }
  });

  document.getElementById('steps-list').addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.btn-toggle-step-header');
    if (toggleBtn) {
      const row = toggleBtn.closest('.dynamic-item');
      const input = row.querySelector('.step-input');
      const isHeader = row.classList.toggle('is-header');
      if (isHeader) {
        input.placeholder = t('form.step.placeholder.header');
      } else {
        input.placeholder = t('form.step.placeholder.item');
      }
      refreshStepNumbers();
      return;
    }

    if (e.target.classList.contains('dynamic-item-remove')) {
      const list = document.getElementById('steps-list');
      if (list.querySelectorAll('.dynamic-item').length > 1) {
        e.target.closest('.dynamic-item').remove();
        refreshStepNumbers();
      } else {
        const row = e.target.closest('.dynamic-item');
        row.querySelector('textarea').value = '';
        row.classList.remove('is-header');
        refreshStepNumbers();
      }
    }
  });

  document.getElementById('btn-cancel-form').addEventListener('click', () => {
    renderRecipeGrid();
    setActiveTab('home');
  });

  document.getElementById('recipe-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitRecipeForm(isEdit);
  });
}

async function submitRecipeForm(isEdit) {
  if (!currentUser) {
    showToast(t('toast.not.connected'), 'error');
    return;
  }
  
  const title = document.getElementById('f-title').value.trim();
  if (!title) {
    showToast(t('toast.title.required'), 'error');
    document.getElementById('f-title').focus();
    return;
  }

  const ingredients = [...document.querySelectorAll('#ingredients-list .dynamic-item')].map(row => {
    const input = row.querySelector('.ingredient-input');
    const value = input.value.trim();
    if (!value) return null;
    const isHeader = row.classList.contains('is-header');
    return isHeader ? `# ${value}` : value;
  }).filter(Boolean);

  const steps = [...document.querySelectorAll('#steps-list .dynamic-item')].map(row => {
    const input = row.querySelector('.step-input');
    const value = input ? input.value.trim() : '';
    if (!value) return null;
    const isHeader = row.classList.contains('is-header');
    return isHeader ? `# ${value}` : value;
  }).filter(Boolean);

  const existingId = document.getElementById('recipe-id').value;
  const btnSave = document.getElementById('btn-save-recipe');
  const originalText = btnSave.innerHTML;
  btnSave.innerHTML = t('form.saving');
  btnSave.disabled = true;

  const rawCat = document.getElementById('f-category').value;
  const canonicalCat = (typeof CATEGORY_EN_TO_FR !== 'undefined' ? (CATEGORY_EN_TO_FR[rawCat] || rawCat) : rawCat) || 'Autres';

  const recipe = {
    id:           existingId || '',
    title,
    category:     canonicalCat,
    author:       document.getElementById('f-author').value.trim(),
    description:  document.getElementById('f-description').value.trim(),
    imageUrl:     document.getElementById('f-image').value.trim(),
    sourceUrl:    document.getElementById('f-source').value.trim(),
    prepTime:     parseInt(document.getElementById('f-prep').value) || 0,
    cookTime:     parseInt(document.getElementById('f-cook').value) || 0,
    servings:     parseFloat(document.getElementById('f-servings').value) || 0,
    servingsUnit: document.getElementById('f-servings-unit').value || 'personnes',
    ingredients,
    steps,
  };

  // Si c'est une modification, on force le recalcul de la nutrition et on vide le cache de traduction
  if (existingId) {
    recipe.nutrition = null;
    if (typeof clearRecipeTranslation === 'function') {
      clearRecipeTranslation(existingId);
    }
  }

  if (!recipe.id) delete recipe.id;

  try {
    await saveRecipe(recipe);
    showToast(isEdit ? t('toast.updated') : t('toast.saved'), 'success');
    await renderRecipeGrid();
    setActiveTab('home');
  } catch (err) {
    showToast(t('toast.error.generic') + err.message, 'error');
    btnSave.innerHTML = originalText;
    btnSave.disabled = false;
  }
}
