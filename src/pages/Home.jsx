import React, { useState, useEffect } from 'react';
import { getPublicRecipes } from '../core/data';
import FeedCard from '../components/Feed/FeedCard';
import SmartSearchBar from '../components/SmartSearchBar/SmartSearchBar';
import '../components/Feed/Feed.css';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tout');
  
  const FILTERS = ['Tout', 'Entrées', 'Plats principaux', 'Desserts', 'Healthy', 'Rapide'];

  useEffect(() => {
    // On charge le fil d'actualité public
    getPublicRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  const filteredRecipes = recipes.filter(r => {
    // Search
    const matchSearch = !search || 
      r.title?.toLowerCase().includes(search.toLowerCase()) || 
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.author?.name?.toLowerCase().includes(search.toLowerCase());
      
    // Category Filter
    const matchFilter = activeFilter === 'Tout' || 
                        r.category === activeFilter ||
                        (r.tags && r.tags.includes(activeFilter)) ||
                        (activeFilter === 'Healthy' && r.title?.toLowerCase().includes('healthy')) ||
                        (activeFilter === 'Rapide' && r.title?.toLowerCase().includes('rapide'));
    
    return matchSearch && matchFilter;
  });

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
