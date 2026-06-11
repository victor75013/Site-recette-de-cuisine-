import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Navigation() {
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', newTheme);
  };

  const [bubbleStyle, setBubbleStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const navRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // On attend un court instant que React Router ajoute la classe .active au nouveau lien
    const updateBubble = () => {
      if (navRef.current) {
        const activeItem = navRef.current.querySelector('.nav-item.active');
        if (activeItem) {
          setBubbleStyle({
            top: activeItem.offsetTop,
            height: activeItem.offsetHeight,
            opacity: window.innerWidth > 768 ? 1 : 0 // Visible uniquement sur PC
          });
        }
      }
    };
    
    // Léger délai pour s'assurer que le DOM est à jour
    const timeout = setTimeout(updateBubble, 10);
    window.addEventListener('resize', updateBubble);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateBubble);
    };
  }, [location.pathname]);

  const triggerSidebarBounce = (e) => {
    // Si on a cliqué sur un bouton (ou à l'intérieur)
    if (e.target.closest('.nav-item')) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.remove('bounce-animation');
        void sidebar.offsetWidth; // Force reflow pour relancer l'animation
        sidebar.classList.add('bounce-animation');
      }
    }
  };

  return (
    <nav className="nav-menu" ref={navRef} onClick={triggerSidebarBounce}>
      
      {/* BULLE COULISSANTE LIQUIDE */}
      <div className="liquid-bubble" style={{ 
        top: `${bubbleStyle.top}px`, 
        height: `${bubbleStyle.height}px`,
        opacity: bubbleStyle.opacity 
      }} />
      
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📖</span>
        <span className="nav-text">Recettes</span>
      </NavLink>

      <NavLink to="/add" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">✏️</span>
        <span className="nav-text">Ajouter</span>
      </NavLink>

      <NavLink to="/import" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🔗</span>
        <span className="nav-text">Importer</span>
      </NavLink>

      <NavLink to="/sites" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🌍</span>
        <span className="nav-text">Sites</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">⚙️</span>
        <span className="nav-text">Réglages</span>
      </NavLink>

      <button className="nav-item theme-btn" onClick={toggleTheme} title="Changer de thème">
        <span className="nav-icon">🌙</span>
        <span className="nav-text">Thème</span>
      </button>

    </nav>
  );
}
