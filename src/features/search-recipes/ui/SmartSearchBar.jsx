import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Search, User } from 'lucide-react';
import './SmartSearchBar.css';

export default function SmartSearchBar({ 
  search, 
  setSearch, 
  activeFilter, 
  setActiveFilter, 
  filters 
}) {
  // Smart Scroll Navigation
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Mobile Filter Modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  const isChefSearch = search.startsWith('@');

  return (
    <>
      <div className={`home-top-bar ${!showNav ? 'hidden' : ''}`}>
        <div className="home-search-wrap">
          <div className={`search-input-container ${isChefSearch ? 'chef-mode' : ''}`}>
            <span className="search-icon">
              {isChefSearch ? <User size={18} className="chef-icon-anim" /> : <Search size={18} />}
            </span>
            <input 
              className="search-input" 
              type="search" 
              placeholder="Rechercher une recette, ou @ pour un chef..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            className="mobile-filter-btn" 
            onClick={() => setIsFilterModalOpen(true)}
            aria-label="Filtres"
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
        
        <div className="home-filter-scroll desktop-only">
          <div className="home-filter-chips">
            {filters.map(f => (
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

      {/* BOTTOM SHEET POUR MOBILE */}
      <div className={`bottom-sheet-overlay ${isFilterModalOpen ? 'open' : ''}`} onClick={() => setIsFilterModalOpen(false)}>
        <div className="bottom-sheet-drawer" onClick={e => e.stopPropagation()}>
          <div className="bottom-sheet-header">
            <h3>Filtres</h3>
            <button className="close-btn" onClick={() => setIsFilterModalOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="bottom-sheet-content">
            {filters.map(f => (
              <button 
                key={f} 
                className={`filter-chip bottom-sheet-chip ${activeFilter === f ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter(f);
                  setIsFilterModalOpen(false); // Ferme auto sur mobile
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
