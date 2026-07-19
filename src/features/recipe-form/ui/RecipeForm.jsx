import React from 'react';
import { CATEGORIES, SERVINGS_UNITS } from '../../../entities/recipe/model/constants';

export function RecipeForm({ form }) {
  const {
    formData,
    isSaving,
    isEdit,
    handleChange,
    handleDynamicChange,
    addDynamicItem,
    removeDynamicItem,
    handleSubmit,
    handleCancel
  } = form;

  return (
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
        <button type="button" className="btn btn--secondary" onClick={handleCancel}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={isSaving}>
          {isSaving ? '⏳ Sauvegarde...' : `💾 ${isEdit ? 'Mettre à jour' : 'Sauvegarder la recette'}`}
        </button>
      </div>
    </form>
  );
}
