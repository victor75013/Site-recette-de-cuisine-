import React from 'react';
import { NavLink } from 'react-router-dom';

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

  return (
    <nav className="nav-menu">
      
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
