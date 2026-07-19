import React from 'react';
import { useRecipeImport } from '../../../features/import-recipe/model/useRecipeImport';
import { ImportForm } from '../../../features/import-recipe/ui/ImportForm';

export function RecipeImporter() {
  const importer = useRecipeImport();

  return (
    <>
      <h1 className="form-page-title">🔗 Importer une recette</h1>
      <ImportForm importer={importer} />
    </>
  );
}
