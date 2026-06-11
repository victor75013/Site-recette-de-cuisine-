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

  // ─── BULLE LIQUIDE (sélectionneur) ───────────────────────────────
  const bubbleRef = useRef({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });
  const bounceTimerRef = useRef(null); // Référence pour nettoyer l'animation si on clique très vite
  const [bubbleStyle, setBubbleStyle] = useState(bubbleRef.current);
  const navRef = useRef(null);
  const location = useLocation();

  const applyStyle = (style) => {
    bubbleRef.current = style;
    setBubbleStyle(style);
  };

  // Calcule la position de la bulle sur l'élément actif
  const recalcBubble = (animate = false) => {
    if (!navRef.current) return;
    const activeItem = navRef.current.querySelector('.nav-item.active');
    if (!activeItem) return;

    const newTop = activeItem.offsetTop;
    const newLeft = activeItem.offsetLeft;
    const newWidth = activeItem.offsetWidth;
    const newHeight = activeItem.offsetHeight;
    const prev = bubbleRef.current;

    // Nettoyage de toute animation de rebond précédente pour éviter les "téléportations" si on clique vite
    if (bounceTimerRef.current) {
      clearTimeout(bounceTimerRef.current);
    }

    // Pas d'animation si c'est la première apparition ou un recalcul silencieux
    if (!animate || prev.opacity === 0) {
      applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
      return;
    }

    const isMobile = window.innerWidth <= 768;
    const distanceX = Math.abs(newLeft - prev.left);
    const distanceY = Math.abs(newTop - prev.top);

    // S'il y a un vrai déplacement → effet squash & stretch
    if ((isMobile && distanceX > 0) || (!isMobile && distanceY > 0)) {
      const squashY = isMobile ? Math.min(distanceX / 12, 16) : 0;
      const squashX = !isMobile ? Math.min(distanceY / 12, 16) : 0;

      // Direction du mouvement pour créer la "queue" derrière la bulle
      const isMovingRight = newLeft > prev.left;
      const isMovingDown = newTop > prev.top;

      const adjustedLeft = newLeft - (isMovingRight && isMobile ? squashY : 0);
      const adjustedTop = newTop - (isMovingDown && !isMobile ? squashX : 0);

      applyStyle({
        top: adjustedTop,
        left: adjustedLeft,
        width: newWidth - squashX + (isMobile ? squashY : 0),
        height: newHeight - squashY + (!isMobile ? squashX : 0),
        opacity: 1
      });

      // Rebond : reprise de la forme normale à mi-parcours (250ms sur 500ms)
      bounceTimerRef.current = setTimeout(() => {
        applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
      }, 250);
    } else {
      applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
    }
  };

  // Quand la route change → animation de la bulle et de la nouvelle icône/texte
  useEffect(() => {
    // 50ms de délai : laisse le GPU initialiser le layer de la sidebar (unshrink)
    const t1 = setTimeout(() => {
      recalcBubble(true);
      
      // On anime l'icône et le texte de la NOUVELLE page active juste après le re-rendu de React
      const activeIcon = navRef.current?.querySelector('.nav-item.active .nav-icon');
      if (activeIcon) {
        activeIcon.classList.remove('icon-bounce');
        setTimeout(() => activeIcon.classList.add('icon-bounce'), 10);
      }

      const activeText = navRef.current?.querySelector('.nav-item.active .nav-text');
      if (activeText) {
        activeText.classList.remove('text-bounce');
        setTimeout(() => activeText.classList.add('text-bounce'), 10);
      }
    }, 50);

    const handleResize = () => recalcBubble(false);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname]);

  // ─── ANIMATION AU CLIC ────────────────────────────────────────
  const handleItemClick = (e, isLink = true) => {
    const isAlreadyActive = isLink && e.currentTarget.classList.contains('active');

    if (isAlreadyActive) {
      e.preventDefault();
      // Comportement standard iOS/Android/Desktop : un clic sur l'onglet actif remonte en haut de page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (!isLink || isAlreadyActive) {
      const icon = e.currentTarget.querySelector('.nav-icon');
      if (icon) {
        icon.classList.remove('icon-bounce');
        setTimeout(() => icon.classList.add('icon-bounce'), 10);
      }

      const text = e.currentTarget.querySelector('.nav-text');
      if (text) {
        text.classList.remove('text-bounce');
        setTimeout(() => text.classList.add('text-bounce'), 10);
      }
    }

    if (isAlreadyActive) {
      const bubble = navRef.current.querySelector('.liquid-bubble');
      if (bubble) {
        bubble.classList.remove('bubble-bounce');
        setTimeout(() => bubble.classList.add('bubble-bounce'), 10);
      }
    }
  };

  return (
    <nav className="nav-menu" ref={navRef}>
      
      {/* BULLE COULISSANTE LIQUIDE */}
      <div className="liquid-bubble" style={{ 
        top: `${bubbleStyle.top}px`, 
        left: `${bubbleStyle.left}px`,
        width: `${bubbleStyle.width}px`,
        height: `${bubbleStyle.height}px`,
        opacity: bubbleStyle.opacity 
      }} />
      
      <NavLink to="/" onClick={(e) => handleItemClick(e)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BookOpen className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Recettes</span>
      </NavLink>

      <NavLink to="/add" onClick={(e) => handleItemClick(e)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PenLine className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Ajouter</span>
      </NavLink>

      <NavLink to="/import" onClick={(e) => handleItemClick(e)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Link className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Importer</span>
      </NavLink>

      <NavLink to="/sites" onClick={(e) => handleItemClick(e)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Globe className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Sites</span>
      </NavLink>

      <NavLink to="/settings" onClick={(e) => handleItemClick(e)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Réglages</span>
      </NavLink>

      <button className="nav-item theme-btn" onClick={(e) => { handleItemClick(e, false); toggleTheme(); }} title="Changer de thème">
        <Moon className="nav-icon" size={22} strokeWidth={2.5} />
        <span className="nav-text">Thème</span>
      </button>

    </nav>
  );
}
