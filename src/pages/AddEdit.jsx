import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getRecipeById, saveRecipe, currentUser } from '../shared/api/data';
import { showToast } from '../shared/lib/utils';

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

export default function AddEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = !!id;

  const prefill = location.state?.prefill || null;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: prefill?.title || '',
    category: prefill?.category || 'Autres',
    author: prefill?.author || '',
    description: prefill?.description || '',
    imageUrl: prefill?.imageUrl || '',
    sourceUrl: prefill?.sourceUrl || '',
    prepTime: prefill?.prepTime || '',
    cookTime: prefill?.cookTime || '',
    servings: prefill?.servings || '',
    servingsUnit: prefill?.servingsUnit || 'personnes',
    ingredients: prefill?.ingredients?.length ? prefill.ingredients : [''],
    steps: prefill?.steps?.length ? prefill.steps : ['']
  });

  useEffect(() => {
    if (isEdit) {
      getRecipeById(id).then(recipe => {
        if (recipe) {
          setFormData({
            title: recipe.title || '',
            category: recipe.category || 'Autres',
            author: recipe.author || '',
            description: recipe.description || '',
            imageUrl: recipe.imageUrl || '',
            sourceUrl: recipe.sourceUrl || '',
            prepTime: recipe.prepTime || '',
            cookTime: recipe.cookTime || '',
            servings: recipe.servings || '',
            servingsUnit: recipe.servingsUnit || 'personnes',
            ingredients: recipe.ingredients?.length ? recipe.ingredients : [''],
            steps: recipe.steps?.length ? recipe.steps : ['']
          });
        }
        setIsLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (type, index, value) => {
    setFormData(prev => {
      const newList = [...prev[type]];
      newList[index] = value;
      return { ...prev, [type]: newList };
    });
  };

  const addDynamicItem = (type) => {
    setFormData(prev => ({ ...prev, [type]: [...prev[type], ''] }));
  };

  const removeDynamicItem = (type, index) => {
    setFormData(prev => {
      const newList = [...prev[type]];
      if (newList.length > 1) {
        newList.splice(index, 1);
      } else {
        newList[0] = '';
      }
      return { ...prev, [type]: newList };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast("Vous devez être connecté pour sauvegarder une recette.", "error");
      return;
    }

    if (!formData.title.trim()) {
      showToast("Le titre est obligatoire.", "error");
      return;
    }

    setIsSaving(true);

    const recipe = {
      ...(isEdit ? { id } : {}),
      title: formData.title.trim(),
      category: formData.category,
      author: formData.author.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
      sourceUrl: formData.sourceUrl.trim(),
      prepTime: parseInt(formData.prepTime) || 0,
      cookTime: parseInt(formData.cookTime) || 0,
      servings: parseFloat(formData.servings) || 0,
      servingsUnit: formData.servingsUnit,
      ingredients: formData.ingredients.map(i => i.trim()).filter(Boolean),
      steps: formData.steps.map(s => s.trim()).filter(Boolean),
    };

    try {
      await saveRecipe(recipe);
      showToast(isEdit ? 'Recette mise à jour !' : 'Recette sauvegardée !', 'success');
      navigate('/');
    } catch (err) {
      showToast('Erreur: ' + err.message, 'error');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="empty-state"><h3>Chargement...</h3></div>;
  }

  return (
    <>
      <h1 className="form-page-title">{isEdit ? '✏️ Modifier la recette' : '🍴 Nouvelle recette'}</h1>

      <form className="form-card" id="recipe-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          
          <div className="form-group form-group--full">
            <label className="form-label" htmlFor="title">Titre de la recette <span style={{color: 'var(--danger)'}}>*</span></label>
            <input className="form-input" id="title" name="title" type="text" placeholder="Ex : Gâteau au chocolat" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="category">Catégorie</label>
            <select className="form-select" id="category" name="category" value={formData.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="author">Auteur / Créateur</label>
            <input className="form-input" id="author" name="author" type="text" placeholder="Ex : Mamie" value={formData.author} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="servings">Portions / Quantité</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="form-input" id="servings" name="servings" type="number" min="0" step="0.5" placeholder="Ex : 4" value={formData.servings} onChange={handleChange} style={{ flex: '1' }} />
              <select className="form-select" name="servingsUnit" value={formData.servingsUnit} onChange={handleChange} style={{ flex: '1' }}>
                {SERVINGS_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prepTime">Temps de préparation (min)</label>
            <input className="form-input" id="prepTime" name="prepTime" type="number" min="0" placeholder="Ex : 15" value={formData.prepTime} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cookTime">Temps de cuisson (min)</label>
            <input className="form-input" id="cookTime" name="cookTime" type="number" min="0" placeholder="Ex : 30" value={formData.cookTime} onChange={handleChange} />
          </div>

          <div className="form-group form-group--full">
            <label className="form-label" htmlFor="description">Brève description</label>
            <textarea className="form-textarea" id="description" name="description" placeholder="Un bref résumé de la recette…" value={formData.description} onChange={handleChange}></textarea>
          </div>

          <div className="form-group form-group--full">
            <label className="form-label" htmlFor="imageUrl">URL de l'image</label>
            <input className="form-input" id="imageUrl" name="imageUrl" type="url" placeholder="https://exemple.com/image.jpg" value={formData.imageUrl} onChange={handleChange} />
          </div>

          <div className="form-group form-group--full">
            <label className="form-label" htmlFor="sourceUrl">Source / URL d'origine</label>
            <input className="form-input" id="sourceUrl" name="sourceUrl" type="url" placeholder="https://site-recette.fr/..." value={formData.sourceUrl} onChange={handleChange} />
          </div>
        </div>

        <hr className="form-divider" />

        <div className="form-section-title">🥄 Ingrédients</div>
        <div className="dynamic-list" id="ingredients-list">
          {formData.ingredients.map((ing, i) => (
            <div className="dynamic-item" key={i}>
              <input className="form-input dynamic-item-input ingredient-input" type="text" placeholder="Ex : 200g de farine" value={ing} onChange={(e) => handleDynamicChange('ingredients', i, e.target.value)} />
              <button type="button" className="dynamic-item-remove" title="Supprimer" onClick={() => removeDynamicItem('ingredients', i)}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn--add-item" onClick={() => addDynamicItem('ingredients')}>
          + Ajouter un ingrédient
        </button>

        <hr className="form-divider" />

        <div className="form-section-title">📋 Étapes de préparation</div>
        <div className="dynamic-list" id="steps-list">
          {formData.steps.map((step, i) => (
            <div className="dynamic-item" key={i}>
              <span className="step-number-badge">{i + 1}</span>
              <textarea className="form-textarea dynamic-item-input step-input list-textarea" placeholder="Décrivez cette étape…" value={step} onChange={(e) => handleDynamicChange('steps', i, e.target.value)}></textarea>
              <button type="button" className="dynamic-item-remove" title="Supprimer" onClick={() => removeDynamicItem('steps', i)}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn--add-item" onClick={() => addDynamicItem('steps')}>
          + Ajouter une étape
        </button>

        <hr className="form-divider" />

        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/')}>Annuler</button>
          <button type="submit" className="btn btn--primary" disabled={isSaving}>
            {isSaving ? '⏳ Sauvegarde...' : `💾 ${isEdit ? 'Mettre à jour' : 'Sauvegarder la recette'}`}
          </button>
        </div>
      </form>
    </>
  );
}
