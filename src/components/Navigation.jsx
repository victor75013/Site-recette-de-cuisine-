import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Mes Recettes', icon: '📖' },
  { path: '/add', label: 'Ajouter', icon: '✏️' },
  { path: '/import', label: 'Importer', icon: '🔗' },
  { path: '/sites', label: 'Sites', icon: '🌍' },
  { path: '/settings', label: 'Paramètres', icon: '⚙️', isSettings: true, mobileLabel: 'Réglages' }
];

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
    <>
      {/* Desktop Main Navigation */}
      <nav className="nav" id="main-nav">
        {NAV_ITEMS.map(item => {
          if (item.isSettings) {
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-btn nav-btn--settings ${isActive ? 'active' : ''}`} title={item.label}>
                {item.icon}
              </NavLink>
            );
          }
          return (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </NavLink>
          );
        })}
        <button className="theme-toggle" id="theme-toggle-btn" title="Changer de thème" onClick={toggleTheme}>
          🌙
        </button>
      </nav>

      {/* Auth UI placeholder (would be hooked up to global state) */}
      <div className="auth-section">
        <button className="btn btn--sm" id="nav-auth" style={{display: 'none'}}>Se connecter</button>
      </div>

      {/* Mobile Bottom Navigation */}
      {/* We use a Portal or just rely on CSS to place it at the bottom */}
    </>
  );
}
