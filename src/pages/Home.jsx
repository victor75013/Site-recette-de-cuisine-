import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { getPublicRecipes } from '../core/data';
import FeedCard from '../components/Feed/FeedCard';
import SmartSearchBar from '../components/SmartSearchBar/SmartSearchBar';
import '../components/Feed/Feed.css';

export default function Home() {
  const navigate = useNavigate();
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

  const categoryFiltered = useMemo(() => {
    return recipes.filter(r => {
      return activeFilter === 'Tout' || 
             r.category === activeFilter ||
             (r.tags && r.tags.includes(activeFilter)) ||
             (activeFilter === 'Healthy' && r.title?.toLowerCase().includes('healthy')) ||
             (activeFilter === 'Rapide' && r.title?.toLowerCase().includes('rapide'));
    });
  }, [recipes, activeFilter]);

  const isChefSearch = search.startsWith('@');
  const actualSearchTerm = isChefSearch ? search.substring(1).trim() : search;

  // Cerveau de Recherche Approximative (Fuse.js)
  const fuse = useMemo(() => {
    return new Fuse(categoryFiltered, {
      keys: isChefSearch ? [
        { name: 'author.name', weight: 2 },
        { name: 'author', weight: 2 }
      ] : [
        { name: 'title', weight: 2 },
        { name: 'category', weight: 1 },
        { name: 'tags', weight: 0.5 }
      ],
      threshold: 0.4, // Tolérance augmentée pour les petits mots (noms)
      ignoreLocation: true
    });
  }, [categoryFiltered, isChefSearch]);

  const filteredRecipes = actualSearchTerm 
    ? fuse.search(actualSearchTerm).map(result => result.item)
    : categoryFiltered;

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
              <FeedCard key={r.id} recipe={r} index={index} onOpenRecipe={() => navigate(`/recipe/${r.id}`, { state: { recipe: r } })} />
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
