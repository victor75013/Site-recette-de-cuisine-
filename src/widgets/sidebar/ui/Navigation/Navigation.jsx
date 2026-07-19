import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, PenLine, Link, Globe, Settings } from 'lucide-react';
import { useLiquidBubble } from './useLiquidBubble';
import LiquidBubble from './LiquidBubble';
import { ThemeToggleButton } from '../../../../features/theme/ui/ThemeToggleButton';
import './Navigation.css';

export function Navigation() {
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

      <ThemeToggleButton onClickWrapper={(e) => handleItemClick(e, false)} />

    </nav>
  );
}
