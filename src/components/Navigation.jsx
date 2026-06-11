import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, PenLine, Link, Globe, Settings, Moon } from 'lucide-react';

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

  const bubbleRef = useRef({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });
  const [bubbleStyle, setBubbleStyle] = useState(bubbleRef.current);
  const navRef = useRef(null);
  const location = useLocation();

  const applyStyle = (style) => {
    bubbleRef.current = style;
    setBubbleStyle(style);
  };

  useEffect(() => {
    // On attend un court instant que React Router ajoute la classe .active au nouveau lien
    const updateBubble = (isResize = false) => {
      if (navRef.current) {
        const activeItem = navRef.current.querySelector('.nav-item.active');
        if (activeItem) {
          const newTop = activeItem.offsetTop;
          const newLeft = activeItem.offsetLeft;
          const newWidth = activeItem.offsetWidth;
          const newHeight = activeItem.offsetHeight;
          const prev = bubbleRef.current;

          // Si on redimensionne l'écran ou initialisation, pas d'animation de vitesse
          if (isResize || prev.opacity === 0) {
            applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
            return;
          }

          const isMobile = window.innerWidth <= 768;
          const distanceX = Math.abs(newLeft - prev.left);
          const distanceY = Math.abs(newTop - prev.top);

          // S'il y a un vrai déplacement (Desktop = Y, Mobile = X)
          if ((isMobile && distanceX > 0) || (!isMobile && distanceY > 0)) {
            // SQUASH & STRETCH PHYSICS :
            // Plus la distance parcourue est grande, plus l'étirement est fort (max 16px de déformation)
            const squashY = isMobile ? Math.min(distanceX / 12, 16) : 0; // S'écrase en hauteur sur mobile
            const squashX = !isMobile ? Math.min(distanceY / 12, 16) : 0; // S'écrase en largeur sur PC

            // On lance le déplacement avec la forme écrasée (vitesse)
            applyStyle({
              top: newTop + (squashY / 2),
              left: newLeft + (squashX / 2),
              width: newWidth - squashX + (isMobile ? squashY : 0), // S'étire dans le sens du mouvement
              height: newHeight - squashY + (!isMobile ? squashX : 0), // S'écrase dans l'autre sens
              opacity: 1
            });

            // Au milieu du vol (250ms pour une animation de 500ms), on lui dit de reprendre sa forme normale pour créer le rebond
            setTimeout(() => {
              applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
            }, 250);
            
          } else {
            applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
          }
        }
      }
    };
    
    // Léger délai pour s'assurer que le DOM est à jour
    const timeout = setTimeout(() => updateBubble(false), 10);
    const handleResize = () => updateBubble(true);

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
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
      
      {/* BULLE COULISSANTE LIQUIDE (Universelle PC & Mobile) */}
      <div className="liquid-bubble" style={{ 
        top: `${bubbleStyle.top}px`, 
        left: `${bubbleStyle.left}px`,
        width: `${bubbleStyle.width}px`,
        height: `${bubbleStyle.height}px`,
        opacity: bubbleStyle.opacity 
      }} />
      
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BookOpen className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Recettes</span>
      </NavLink>

      <NavLink to="/add" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PenLine className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Ajouter</span>
      </NavLink>

      <NavLink to="/import" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Link className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Importer</span>
      </NavLink>

      <NavLink to="/sites" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Globe className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Sites</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Réglages</span>
      </NavLink>

      <button className="nav-item theme-btn" onClick={toggleTheme} title="Changer de thème">
        <Moon className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Thème</span>
      </button>

    </nav>
  );
}
