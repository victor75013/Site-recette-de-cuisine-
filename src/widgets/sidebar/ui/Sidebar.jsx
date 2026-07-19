import React, { useRef } from 'react';
import { useAuth } from '../../../features/auth/model/useAuth';
import { AuthProfile } from '../../../features/auth/ui/AuthProfile';
import { useSidebarScroll } from '../model/useSidebarScroll';
import { Navigation } from './Navigation/Navigation';
import './Sidebar.css';

export function Sidebar() {
  const { user, login, logout } = useAuth();
  const sidebarRef = useRef(null);

  // Hook gérant le comportement de scroll sur mobile (rétractation de la sidebar)
  useSidebarScroll(sidebarRef);

  return (
    <aside className="sidebar" ref={sidebarRef}>
      
      {/* ─── HAUT : LOGO ET MARQUE ─── */}
      <div className="sidebar-top">
        <div className="brand">
          <img src="/assets/icons/icon-512.png" alt="Logo" className="brand-icon" />
          <span className="brand-name">Carnet de Recettes</span>
        </div>
      </div>

      {/* ─── MILIEU : NAVIGATION ET BULLE LIQUIDE ─── */}
      <div className="sidebar-middle">
        <Navigation />
      </div>

      {/* ─── BAS : AUTHENTIFICATION ET PROFIL ─── */}
      <div className="sidebar-bottom">
        <div className="auth-section">
          <AuthProfile user={user} onLogin={login} onLogout={logout} />
        </div>
      </div>

    </aside>
  );
}
