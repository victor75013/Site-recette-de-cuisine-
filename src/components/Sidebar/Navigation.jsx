import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, PenLine, Link, Globe, Settings, Moon } from 'lucide-react';
import { useLiquidBubble } from './useLiquidBubble';
import LiquidBubble from './LiquidBubble';
import './Navigation.css';

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

  const navRef = React.useRef(null);
  const { bubbleStyle, isAnimating, handleItemClick } = useLiquidBubble(navRef);

  return (
    <nav className="nav-menu" ref={navRef}>
      
      {/* BULLE COULISSANTE LIQUIDE */}
      <LiquidBubble bubbleStyle={bubbleStyle} isAnimating={isAnimating} />
      
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
