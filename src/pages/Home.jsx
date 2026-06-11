import React, { useState, useEffect } from 'react';
import { getAllRecipes } from '../core/data';

function formatTime(minutes) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function getCategoryEmoji(category) {
  const CATEGORY_EMOJI = {
    'Entrées': '🥗', 'Plats principaux': '🍽️', 'Desserts': '🍰',
    'Soupes': '🍜', 'Salades': '🥙', 'Marinades': '🥩',
    'Sauces': '🫙', 'Petits-déjeuners': '🥞', 'Snacks': '🥨',
    'Boissons': '🥤', 'Autres': '🍴',
  };
  return CATEGORY_EMOJI[category] || '🍴';
}

function RecipeCard({ recipe, onClick }) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const timeLabel = formatTime(totalTime);
  const emoji = getCategoryEmoji(recipe.category);

  return (
    <article className="recipe-card" onClick={onClick} role="button" tabIndex="0">
      {recipe.imageUrl && (
        <div className="card-bg-blur">
          <img src={recipe.imageUrl} aria-hidden="true" loading="lazy" alt="" />
        </div>
      )}
      <div className="card-color-wash"></div>
      <div className="card-bg-overlay"></div>
      
      <div className="card-image-wrap">
        {recipe.imageUrl ? (
          <img className="card-image" src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
        ) : (
          <div className="card-image-placeholder">{emoji}</div>
        )}
      </div>
      
      <div className="card-info">
        {recipe.category && <span className="card-category">{emoji} {recipe.category}</span>}
        <h2 className="card-title">{recipe.title}</h2>
        <div className="card-meta">
          {timeLabel && <span className="meta-item">⏱️ {timeLabel}</span>}
          {recipe.author && <span className="meta-item">👤 {recipe.author}</span>}
          {recipe.ingredients?.length > 0 && <span className="meta-item">🥄 {recipe.ingredients.length} ingr.</span>}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  const filteredRecipes = recipes.filter(r => 
    !search || 
    r.title?.toLowerCase().includes(search.toLowerCase()) || 
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Mes <span>Recettes</span></h1>
        <span className="recipe-count">{filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''}</span>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input 
            className="search-input" 
            type="search" 
            placeholder="Rechercher une recette..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><h3>Chargement des recettes...</h3></div>
      ) : (
        <div className="recipe-grid">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map(r => (
              <RecipeCard key={r.id} recipe={r} onClick={() => alert('Ouvrir modal pour ' + r.title)} />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>Aucune recette trouvée</h3>
            </div>
          )}
        </div>
      )}
    </>
  );
}
