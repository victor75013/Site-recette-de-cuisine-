import React from 'react';
import { RecipeDetailsView } from '../widgets/recipe-details-view/ui/RecipeDetailsView';

export default function RecipeView({ asModal }) {
  return <RecipeDetailsView asModal={asModal} />;
}
