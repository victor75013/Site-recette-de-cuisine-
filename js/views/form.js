/* ============================================================
   form.js — Formulaire d'ajout / modification de recette
   ============================================================ */

const CATEGORIES = [
  'Entrées', 'Plats principaux', 'Desserts', 'Soupes',
  'Salades', 'Marinades', 'Sauces', 'Petits-déjeuners',
  'Snacks', 'Boissons', 'Autres',
];

const SERVINGS_UNITS = [
  { value: 'personnes', label: 'personnes' },
  { value: 'portions',  label: 'portions'  },
  { value: 'pièces',    label: 'pièces'    },
  { value: 'kg',        label: 'kg'        },
  { value: 'g',         label: 'g'         },
  { value: 'litres',    label: 'litres'    },
  { value: 'cl',        label: 'cl'        },
];

async function renderAddEditForm(editId = null, prefill = null) {
  const app    = document.getElementById('app');
  app.innerHTML = `<div class="empty-state"><h3>Chargement...</h3></div>`;
  
  const recipe = editId ? await getRecipeById(editId) : null;
  const data   = recipe || prefill || {};
  const isEdit = !!recipe;

  const allRecipes = await getAllRecipes();
  const authors = [...new Set(allRecipes.map(r => r.author).filter(Boolean))].sort();

  const categoryOptions = CATEGORIES.map(c =>
    `<option value="${c}" ${data.category === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  const ingredients = data.ingredients?.length ? data.ingredients : [''];
  const steps = data.steps?.length ? data.steps : [''];

  app.innerHTML = `
    <h1 class="form-page-title">${isEdit ? '✏️ Modifier la recette' : '🍴 Nouvelle recette'}</h1>

    <form class="form-card" id="recipe-form" novalidate>
      <input type="hidden" id="recipe-id" value="${isEdit ? escapeHtml(recipe.id) : ''}" />

      <div class="form-grid">
        <!-- Titre -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-title">Titre <span>*</span></label>
          <input class="form-input" id="f-title" type="text" required
                 placeholder="Ex : Risotto aux champignons"
                 value="${escapeHtml(data.title || '')}" />
        </div>

        <!-- Catégorie -->
        <div class="form-group">
          <label class="form-label" for="f-category">Catégorie</label>
          <select class="form-select" id="f-category">
            <option value="">— Choisir —</option>
            ${categoryOptions}
          </select>
        </div>

        <!-- Auteur -->
        <div class="form-group">
          <label class="form-label" for="f-author">Auteur de la recette</label>
          <input class="form-input" id="f-author" type="text" list="author-list"
                 placeholder="Ex : Victor"
                 value="${escapeHtml(data.author || '')}" />
          <datalist id="author-list">
            ${authors.map(a => `<option value="${escapeHtml(a)}"></option>`).join('')}
          </datalist>
        </div>

        <!-- Quantité -->
        <div class="form-group">
          <label class="form-label" for="f-servings">Quantité</label>
          <div style="display:flex; gap:8px;">
            <input class="form-input" id="f-servings" type="number" min="0" step="any"
                   placeholder="Ex : 4"
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
          <label class="form-label" for="f-prep">Temps de préparation (min)</label>
          <input class="form-input" id="f-prep" type="number" min="0"
                 placeholder="Ex : 15"
                 value="${data.prepTime || ''}" />
        </div>

        <!-- Temps cuisson -->
        <div class="form-group">
          <label class="form-label" for="f-cook">Temps de cuisson (min)</label>
          <input class="form-input" id="f-cook" type="number" min="0"
                 placeholder="Ex : 30"
                 value="${data.cookTime || ''}" />
        </div>

        <!-- Description -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-description">Brève description</label>
          <textarea class="form-textarea" id="f-description"
                    placeholder="Un bref résumé de la recette…">${escapeHtml(data.description || '')}</textarea>
        </div>

        <!-- Image URL -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-image">URL de l'image</label>
          <input class="form-input" id="f-image" type="url"
                 placeholder="https://exemple.com/image.jpg"
                 value="${escapeHtml(data.imageUrl || '')}" />
        </div>

        <!-- Source URL -->
        <div class="form-group form-group--full">
          <label class="form-label" for="f-source">Source / URL d'origine</label>
          <input class="form-input" id="f-source" type="url"
                 placeholder="https://site-recette.fr/..."
                 value="${escapeHtml(data.sourceUrl || '')}" />
        </div>
      </div>

      <hr class="form-divider" />

      <!-- INGRÉDIENTS -->
      <div class="form-section-title">🥄 Ingrédients</div>
      <div class="dynamic-list" id="ingredients-list">
        ${ingredients.map((ing, i) => renderIngredientRow(ing, i)).join('')}
      </div>
      <button type="button" class="btn btn--add-item" id="btn-add-ingredient">
        + Ajouter un ingrédient
      </button>

      <hr class="form-divider" />

      <!-- ÉTAPES -->
      <div class="form-section-title">📋 Étapes de préparation</div>
      <div class="dynamic-list" id="steps-list">
        ${steps.map((step, i) => renderStepRow(step, i)).join('')}
      </div>
      <button type="button" class="btn btn--add-item" id="btn-add-step">
        + Ajouter une étape
      </button>

      <hr class="form-divider" />

      <!-- ACTIONS -->
      <div class="form-actions">
        <button type="button" class="btn btn--secondary" id="btn-cancel-form">Annuler</button>
        <button type="submit" class="btn btn--primary" id="btn-save-recipe">
          💾 ${isEdit ? 'Mettre à jour' : 'Sauvegarder la recette'}
        </button>
      </div>
    </form>
  `;

  bindFormEvents(isEdit);
}

function renderIngredientRow(value = '', index) {
  return `
    <div class="dynamic-item" data-index="${index}">
      <input class="form-input dynamic-item-input ingredient-input"
             type="text"
             placeholder="Ex : 200g de farine"
             value="${escapeHtml(value)}" />
      <button type="button" class="dynamic-item-remove" title="Supprimer" aria-label="Supprimer cet ingrédient">✕</button>
    </div>
  `;
}

function renderStepRow(value = '', index) {
  return `
    <div class="dynamic-item" data-index="${index}">
      <span class="step-number-badge">${index + 1}</span>
      <textarea class="form-textarea dynamic-item-input step-input list-textarea"
                placeholder="Décrivez cette étape…">${escapeHtml(value)}</textarea>
      <button type="button" class="dynamic-item-remove" title="Supprimer" aria-label="Supprimer cette étape">✕</button>
    </div>
  `;
}

function refreshStepNumbers() {
  document.querySelectorAll('#steps-list .step-number-badge').forEach((badge, i) => {
    badge.textContent = i + 1;
  });
}

function bindFormEvents(isEdit) {
  document.getElementById('btn-add-ingredient').addEventListener('click', () => {
    const list = document.getElementById('ingredients-list');
    const count = list.querySelectorAll('.dynamic-item').length;
    list.insertAdjacentHTML('beforeend', renderIngredientRow('', count));
    list.lastElementChild.querySelector('input').focus();
  });

  document.getElementById('btn-add-step').addEventListener('click', () => {
    const list = document.getElementById('steps-list');
    const count = list.querySelectorAll('.dynamic-item').length;
    list.insertAdjacentHTML('beforeend', renderStepRow('', count));
    refreshStepNumbers();
    list.lastElementChild.querySelector('textarea').focus();
  });

  document.getElementById('ingredients-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('dynamic-item-remove')) {
      const list = document.getElementById('ingredients-list');
      if (list.querySelectorAll('.dynamic-item').length > 1) {
        e.target.closest('.dynamic-item').remove();
      } else {
        e.target.closest('.dynamic-item').querySelector('input').value = '';
      }
    }
  });

  document.getElementById('steps-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('dynamic-item-remove')) {
      const list = document.getElementById('steps-list');
      if (list.querySelectorAll('.dynamic-item').length > 1) {
        e.target.closest('.dynamic-item').remove();
        refreshStepNumbers();
      } else {
        e.target.closest('.dynamic-item').querySelector('textarea').value = '';
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
    showToast("Vous devez être connecté pour sauvegarder une recette.", "error");
    return;
  }
  
  const title = document.getElementById('f-title').value.trim();
  if (!title) {
    showToast('Le titre est obligatoire.', 'error');
    document.getElementById('f-title').focus();
    return;
  }

  const ingredients = [...document.querySelectorAll('.ingredient-input')]
    .map(el => el.value.trim()).filter(Boolean);

  const steps = [...document.querySelectorAll('.step-input')]
    .map(el => el.value.trim()).filter(Boolean);

  const existingId = document.getElementById('recipe-id').value;
  const btnSave = document.getElementById('btn-save-recipe');
  const originalText = btnSave.innerHTML;
  btnSave.innerHTML = '⏳ Sauvegarde...';
  btnSave.disabled = true;

  const recipe = {
    id:           existingId || '',
    title,
    category:     document.getElementById('f-category').value || 'Autres',
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

  if (!recipe.id) delete recipe.id; // Let Firestore generate ID

  try {
    await saveRecipe(recipe);
    showToast(isEdit ? 'Recette mise à jour !' : 'Recette sauvegardée !', 'success');
    await renderRecipeGrid();
    setActiveTab('home');
  } catch (err) {
    showToast('Erreur: ' + err.message, 'error');
    btnSave.innerHTML = originalText;
    btnSave.disabled = false;
  }
}
