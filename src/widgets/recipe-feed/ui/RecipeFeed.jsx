import React, { useState, useEffect } from 'react';
import { useNavigate, useNavigationType, useLocation } from 'react-router-dom';
import { getPublicRecipes } from '../../../shared/api/data';
import SmartSearchBar from '../../../features/search-recipes/ui/SmartSearchBar';
import { useRecipeSearch } from '../../../features/search-recipes/model/useRecipeSearch';
import RecipeCard from '../../../entities/recipe/ui/RecipeCard';

export function RecipeFeed() {
  const navigate = useNavigate();
  const navType = useNavigationType();
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tout');
  
  // POP means we navigated back (e.g., from RecipeView via browser back or navigate(-1))
  const skipCascade = navType === 'POP';

  const FILTERS = ['Tout', 'Entrées', 'Plats principaux', 'Desserts', 'Healthy', 'Rapide'];

  useEffect(() => {
    // On charge le fil d'actualité public
    getPublicRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  const filteredRecipes = useRecipeSearch(recipes, search, activeFilter);

  return (
    <>
      <SmartSearchBar 
        search={search}
        setSearch={setSearch}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        filters={FILTERS}
      />

      {loading ? (
        <div className="empty-state"><h3>Chargement du feed...</h3></div>
      ) : (
        <div className="feed-container">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((r, index) => (
              <RecipeCard 
                key={r.id} 
                recipe={r} 
                index={index} 
                disableCascade={skipCascade} 
                onOpenRecipe={() => navigate(`/recipe/${r.id}`, { state: { recipe: r, backgroundLocation: location } })} 
              />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Aucune recette trouvée</h3>
              <p>Soyez le premier à partager une recette publique !</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
