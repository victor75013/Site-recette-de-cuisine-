import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRecipeForm } from '../../../features/recipe-form/model/useRecipeForm';
import { RecipeForm } from '../../../features/recipe-form/ui/RecipeForm';

export function RecipeEditor() {
  const { id } = useParams();
  const location = useLocation();
  const prefill = location.state?.prefill || null;

  const form = useRecipeForm(id, prefill);

  if (form.isLoading) {
    return <div className="empty-state"><h3>Chargement...</h3></div>;
  }

  return (
    <>
      <h1 className="form-page-title">{form.isEdit ? '✏️ Modifier la recette' : '🍴 Nouvelle recette'}</h1>
      <RecipeForm form={form} />
    </>
  );
}
