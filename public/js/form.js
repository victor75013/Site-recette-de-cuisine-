/* ============================================================
   form.js — Formulaire d'ajout / modification de recette (ES Module)
   ============================================================ */

import { getAllRecipes, getRecipeById, saveRecipe, currentUser } from './data.js';
import { t, getLang } from './i18n/index.js';
import { escapeHtml } from './utils.js';
import { findRecipeImage } from './importer.js';
import { getIngredientText } from './nutrition.js';

export const CATEGORIES_FR = [
  'Entrées', 'Plats principaux', 'Desserts', 'Soupes',
  'Salades', 'Marinades', 'Sauces', 'Petits-déjeuners',
  'Snacks', 'Boissons', 'Autres',
];

export const CATEGORIES_EN = [
  'Starters', 'Main courses', 'Desserts', 'Soups',
  'Salads', 'Marinades', 'Sauces', 'Breakfasts',
  'Snacks', 'Drinks', 'Others',
];

export function getCategories() {
  return getLang() === 'en' ? CATEGORIES_EN : CATEGORIES_FR;
}

export function getServingsUnits() {
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

export async function renderAddEditForm(editId = null, prefill = null) {
  const app = document.getElementById('app');
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
        <div class="form-group" style="grid-column: 1 / -1;">
          <label class="form-label" for="f-title">${t('form.title.label')} *</label>
          <input class="form-input" id="f-title" type="text"
                 placeholder="${t('form.title.placeholder')}"
                 value="${escapeHtml(data.title || '')}" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="f-category">${t('form.category.label')}</label>
          <select class="form-select" id="f-category">
            <option value="">${t('form.category.choose')}</option>
            ${categoryOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="f-author">${t('form.author.label')}</label>
          <input class="form-input" id="f-author" type="text"
                 list="authors-datalist"
                 placeholder="${t('form.author.placeholder')}"
                 value="${escapeHtml(data.author || '')}" />
          <datalist id="authors-datalist">
            ${authors.map(a => `<option value="${escapeHtml(a)}">`).join('')}
          </datalist>
        </div>

        <div class="form-group">
          <label class="form-label" for="f-servings">${t('form.qty.label')}</label>
          <div class="u-flex u-gap-sm">
            <input class="form-input" id="f-servings" type="number" min="1"
                   placeholder="${t('form.qty.placeholder')}"
                   value="${data.servings || ''}" style="max-width:90px;" />
            <select class="form-select" id="f-servings-unit">
              ${SERVINGS_UNITS.map(u =>
                `<option value="${u.value}" ${(data.servingsUnit || 'personnes') === u.value ? 'selected' : ''}>${u.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="f-prep-time">${t('form.prep.label')}</label>
          <input class="form-input" id="f-prep-time" type="number" min="0"
                 placeholder="${t('form.prep.placeholder')}"
                 value="${data.prepTime || ''}" />
        </div>

        <div class="form-group">
          <label class="form-label" for="f-cook-time">${t('form.cook.label')}</label>
          <input class="form-input" id="f-cook-time" type="number" min="0"
                 placeholder="${t('form.cook.placeholder')}"
                 value="${data.cookTime || ''}" />
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label class="form-label" for="f-description">${t('form.desc.label')}</label>
          <textarea class="form-textarea" id="f-description"
                    placeholder="${t('form.desc.placeholder')}">${escapeHtml(data.description || '')}</textarea>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label class="form-label" for="f-image">${t('form.image.label')}</label>
          <input class="form-input" id="f-image" type="url"
                 placeholder="https://exemple.com/image.jpg"
                 value="${escapeHtml(data.imageUrl || '')}" />
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label class="form-label" for="f-source">${t('form.source.label')}</label>
          <input class="form-input" id="f-source" type="url"
                 placeholder="https://site-recette.fr/..."
                 value="${escapeHtml(data.sourceUrl || '')}" />
        </div>
      </div>

      <hr class="form-divider" />

      <h3 class="detail-section-title">${t('form.ingredients.title')}</h3>
      <div id="ingredients-list">
        ${ingredients.map((ing, i) => renderIngredientRow(ing, i)).join('')}
      </div>
      <div class="u-flex u-gap-sm u-mt-sm">
        <button type="button" class="btn btn--secondary btn--sm" id="btn-add-ingredient" style="flex:1;">
          ${t('form.add.ingredient')}
        </button>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-add-section" style="flex:1;">
          ${t('form.add.section')}
        </button>
      </div>

      <hr class="form-divider" />

      <h3 class="detail-section-title">${t('form.steps.title')}</h3>
      <div id="steps-list">
        ${steps.map((step, i) => renderStepRow(step, i)).join('')}
      </div>
      <div class="u-flex u-gap-sm u-mt-sm">
        <button type="button" class="btn btn--secondary btn--sm" id="btn-add-step" style="flex:1;">
          ${t('form.add.step')}
        </button>
        <button type="button" class="btn btn--secondary btn--sm" id="btn-add-step-section" style="flex:1;">
          ${t('form.add.section')}
        </button>
      </div>

      <hr class="form-divider" />

      <div class="u-flex u-gap-md" style="justify-content:flex-end;">
        <button type="button" class="btn btn--secondary" id="btn-cancel-form">${t('form.cancel')}</button>
        <button type="submit" class="btn btn--primary" id="btn-save-recipe">
          ${isEdit ? t('form.save.edit') : t('form.save.new')}
        </button>
      </div>
    </form>
  `;

  bindFormEvents(isEdit);
}

function renderIngredientRow(value = '', index = 0) {
  value = getIngredientText(value);
  const isHeader = value.trim().startsWith('#');
  const cleanVal = isHeader ? value.trim().replace(/^#+\s*/, '') : value;

  return `
    <div class="dynamic-list-row ${isHeader ? 'is-header-row' : ''}">
      <input class="form-input ing-input" type="text"
             placeholder="${isHeader ? t('form.ing.placeholder.header') : t('form.ing.placeholder.item')}"
             value="${escapeHtml(cleanVal)}"
             data-is-header="${isHeader}" />
      <button type="button" class="btn-remove-row" aria-label="Supprimer cet ingrédient">✕</button>
    </div>
  `;
}

function renderStepRow(value = '', index = 0) {
  const isHeader = typeof value === 'string' && value.trim().startsWith('#');
  const cleanVal = isHeader ? value.trim().replace(/^#+\s*/, '') : value;

  return `
    <div class="dynamic-list-row ${isHeader ? 'is-header-row' : ''}">
      <textarea class="form-textarea step-input"
                placeholder="${isHeader ? t('form.step.placeholder.header') : t('form.step.placeholder.item')}"
                data-is-header="${isHeader}">${escapeHtml(cleanVal)}</textarea>
      <button type="button" class="btn-remove-row" aria-label="Supprimer cette étape">✕</button>
    </div>
  `;
}

function bindFormEvents(isEdit) {
  const ingList = document.getElementById('ingredients-list');
  const stepList = document.getElementById('steps-list');

  document.getElementById('btn-add-ingredient')?.addEventListener('click', () => {
    ingList.insertAdjacentHTML('beforeend', renderIngredientRow('', ingList.children.length));
    ingList.lastElementChild.querySelector('input')?.focus();
  });

  document.getElementById('btn-add-section')?.addEventListener('click', () => {
    ingList.insertAdjacentHTML('beforeend', renderIngredientRow('# ', ingList.children.length));
    ingList.lastElementChild.querySelector('input')?.focus();
  });

  document.getElementById('btn-add-step')?.addEventListener('click', () => {
    stepList.insertAdjacentHTML('beforeend', renderStepRow('', stepList.children.length));
    stepList.lastElementChild.querySelector('textarea')?.focus();
  });

  document.getElementById('btn-add-step-section')?.addEventListener('click', () => {
    stepList.insertAdjacentHTML('beforeend', renderStepRow('# ', stepList.children.length));
    stepList.lastElementChild.querySelector('textarea')?.focus();
  });

  [ingList, stepList].forEach(list => {
    list?.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-row')) {
        const row = e.target.closest('.dynamic-list-row');
        if (list.children.length > 1) row.remove();
        else {
          const input = row.querySelector('input, textarea');
          if (input) input.value = '';
        }
      }
    });
  });

  document.getElementById('btn-cancel-form')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'home' } }));
  });

  document.getElementById('recipe-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('f-title').value.trim();
    if (!title) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('toast.title.required'), type: 'error' } }));
      return;
    }

    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('toast.not.connected'), type: 'error' } }));
      return;
    }

    const saveBtn = document.getElementById('btn-save-recipe');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = t('form.saving');
    }

    const ingredients = Array.from(document.querySelectorAll('.ing-input'))
      .map(input => {
        const val = input.value.trim();
        if (!val) return null;
        return input.dataset.isHeader === 'true' ? `# ${val}` : val;
      })
      .filter(Boolean);

    const steps = Array.from(document.querySelectorAll('.step-input'))
      .map(input => {
        const val = input.value.trim();
        if (!val) return null;
        return input.dataset.isHeader === 'true' ? `# ${val}` : val;
      })
      .filter(Boolean);

    let imageUrl = document.getElementById('f-image').value.trim();
    if (!imageUrl && !isEdit) {
      imageUrl = await findRecipeImage(title);
    }

    const recipeData = {
      id: document.getElementById('recipe-id').value || null,
      title,
      category: document.getElementById('f-category').value || 'Autres',
      author: document.getElementById('f-author').value.trim(),
      servings: parseInt(document.getElementById('f-servings').value, 10) || null,
      servingsUnit: document.getElementById('f-servings-unit').value || 'personnes',
      prepTime: parseInt(document.getElementById('f-prep-time').value, 10) || null,
      cookTime: parseInt(document.getElementById('f-cook-time').value, 10) || null,
      description: document.getElementById('f-description').value.trim(),
      imageUrl,
      sourceUrl: document.getElementById('f-source').value.trim(),
      ingredients,
      steps,
    };

    try {
      await saveRecipe(recipeData);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: isEdit ? t('toast.updated') : t('toast.saved'), type: 'success' } }));
      window.dispatchEvent(new CustomEvent('app:navigate', { detail: { tab: 'home' } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('toast.error.generic') + err.message, type: 'error' } }));
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? t('form.save.edit') : t('form.save.new');
      }
    }
  });
}
