import React, { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { onAuthChange, loginWithGoogle, logout } from '../../core/data';
import Navigation from './Navigation';
import './Sidebar.css';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const sidebarRef = useRef(null);

  // ─── AUTHENTIFICATION ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  // ─── SCROLL SHRINK (mobile uniquement) ───────────────────────────
  // Verrou de cooldown : après chaque changement d'état, on bloque pendant 400ms
  // pour laisser la transition CSS finir tranquillement (zéro conflit possible)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let cooldown = false;

    const handleScroll = () => {
      const sidebar = sidebarRef.current;
      if (!sidebar || window.innerWidth > 768) return;

      const currentY = window.scrollY;
      const isShrunk = sidebar.classList.contains('sidebar--shrunk');

      // PRIORITÉ ABSOLUE : si on est tout en haut → toujours dé-réduire
      // Couvre le scrollTo(0,0) déclenché par un clic sur une icône de navigation
      if (currentY <= 0 && isShrunk) {
        sidebar.classList.remove('sidebar--shrunk');
        cooldown = true;
        setTimeout(() => { cooldown = false; }, 400);
        lastScrollY = 0;
        return;
      }

      // Pendant le cooldown, on met juste à jour lastScrollY pour garder la référence correcte
      if (cooldown) {
        lastScrollY = currentY;
        return;
      }

      const goingDown = currentY > lastScrollY;

      // Scroll vers le bas + assez loin de la page → réduire
      if (goingDown && currentY > 60 && !isShrunk) {
        sidebar.classList.add('sidebar--shrunk');
        cooldown = true;
        setTimeout(() => { cooldown = false; }, 400);
      }
      // Scroll vers le haut → agrandir
      else if (!goingDown && isShrunk) {
        sidebar.classList.remove('sidebar--shrunk');
        cooldown = true;
        setTimeout(() => { cooldown = false; }, 400);
      }

      lastScrollY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          {!user ? (
            <button className="btn btn--sm btn--auth" onClick={loginWithGoogle}>
              <LogIn className="auth-icon" size={22} strokeWidth={2.5} />
              <span className="auth-text">Connexion</span>
            </button>
          ) : (
            <div className="auth-user">
              <img src={user.photoURL || ''} alt="Avatar" className="auth-avatar" />
              <button className="btn btn--sm btn--danger btn--auth" onClick={logout}>
                <LogOut className="auth-icon" size={22} strokeWidth={2.5} />
                <span className="auth-text">Quitter</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
