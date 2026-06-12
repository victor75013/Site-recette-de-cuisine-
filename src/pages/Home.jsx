import React, { useState, useEffect } from 'react';
import { getPublicRecipes } from '../core/data';
import FeedCard from '../components/Feed/FeedCard';
import '../components/Feed/Feed.css';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // On charge le fil d'actualité public
    getPublicRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  const filteredRecipes = recipes.filter(r => 
    !search || 
    r.title?.toLowerCase().includes(search.toLowerCase()) || 
    r.category?.toLowerCase().includes(search.toLowerCase()) ||
    r.author?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Découvrir <span>Insta-Food</span></h1>
        <span className="recipe-count">{filteredRecipes.length} post{filteredRecipes.length > 1 ? 's' : ''}</span>
      </div>

      <div className="toolbar" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input 
            className="search-input" 
            type="search" 
            placeholder="Rechercher une recette ou un chef..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><h3>Chargement du feed...</h3></div>
      ) : (
        <div className="feed-container">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map(r => (
              <FeedCard key={r.id} recipe={r} onOpenRecipe={() => console.log('Ouvrir recette', r.title)} />
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
