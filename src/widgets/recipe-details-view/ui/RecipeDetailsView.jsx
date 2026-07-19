import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getRecipeById } from '../../../shared/api/data';
import useDominantColor from '../../../shared/lib/hooks/useDominantColor';
import { RecipeDetails } from '../../../entities/recipe/ui/RecipeDetails/RecipeDetails';

export function RecipeDetailsView({ asModal }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // On tente d'abord de récupérer la recette depuis le state du Router (instantané)
  const [recipe, setRecipe] = useState(location.state?.recipe || null);
  const [loading, setLoading] = useState(!recipe);

  useEffect(() => {
    // Si pas de recette dans le state (ex: refresh direct de l'URL), on la charge
    if (!recipe) {
      getRecipeById(id).then(data => {
        setRecipe(data);
        setLoading(false);
      });
    }
  }, [id, recipe]);

  const handleBack = () => {
    navigate(-1);
  };

  // Image de secours
  const displayImage = recipe?.imageUrl || 'https://images.unsplash.com/photo-1495195134817-a1a18bc081ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
  
  // Magie : on extrait la couleur dominante de l'image
  const colorData = useDominantColor(displayImage);

  if (loading) {
    return <div className="empty-state"><h3>Chargement de la recette...</h3></div>;
  }

  if (!recipe) {
    return (
      <div className="empty-state">
        <h3>Recette introuvable 😕</h3>
        <button className="btn btn--primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <RecipeDetails 
      recipe={recipe} 
      asModal={asModal} 
      handleBack={handleBack} 
      colorData={colorData} 
      displayImage={displayImage} 
    />
  );
}
