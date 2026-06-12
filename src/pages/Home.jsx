import React, { useState, useEffect } from 'react';
import { getPublicRecipes } from '../core/data';
import FeedCard from '../components/Feed/FeedCard';
import '../components/Feed/Feed.css';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tout');
  
  // Smart Scroll Navigation
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const FILTERS = ['Tout', 'Entrées', 'Plats principaux', 'Desserts', 'Healthy', 'Rapide'];

  useEffect(() => {
    // On charge le fil d'actualité public
    getPublicRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleScroll = (e) => {
      const currentScrollY = e.target.scrollTop !== undefined ? e.target.scrollTop : window.scrollY;
      
      // Si on scroll vers le bas et qu'on a dépassé 50px, on cache
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowNav(false);
      } 
      // Si on scroll vers le haut, on réaffiche
      else if (currentScrollY < lastScrollY) {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };

    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (mainContent) mainContent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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
      <div className={`home-top-bar ${!showNav ? 'hidden' : ''}`}>
        <div className="home-search-wrap">
          <span className="search-icon">🔍</span>
          <input 
            className="search-input" 
            type="search" 
            placeholder="Rechercher une recette ou un chef..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="home-filter-scroll">
          <div className="home-filter-chips">
            {FILTERS.map(f => (
              <button 
                key={f} 
                className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
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
