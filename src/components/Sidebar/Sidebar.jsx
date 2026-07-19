import React, { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { onAuthChange, loginWithGoogle, logout } from '../../shared/api/data';
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



  // ─── GESTIONNAIRE DE SCROLL ET VERROUILLAGE (SENIOR APPROACH) ───
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    let isNavigationLocked = false;
    let lockTimeout = null;

    // Fonction pure pour manipuler le DOM sans re-rendu
    const setShrunk = (shrunk) => {
      if (!sidebarRef.current) return;
      if (shrunk) {
        sidebarRef.current.classList.add('sidebar--shrunk');
      } else {
        sidebarRef.current.classList.remove('sidebar--shrunk');
      }
    };

    const handleScroll = () => {
      if (window.innerWidth > 768) return;
      
      // Si une navigation est en cours, on IGNORE totalement le scroll
      if (isNavigationLocked) return;

      const currentY = window.scrollY;

      // Anti-rebond iOS (scroll négatif ou tout en haut)
      if (currentY <= 0) {
        setShrunk(false);
        lastScrollY = currentY;
        return;
      }

      // Seuil de déclenchement pour éviter la sensibilité extrême
      if (Math.abs(currentY - lastScrollY) > 10) {
        const goingDown = currentY > lastScrollY;
        
        if (goingDown && currentY > 60) {
          setShrunk(true); // On descend -> rétrécir
        } else if (!goingDown) {
          setShrunk(false); // On monte -> agrandir
        }
        lastScrollY = currentY;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Écouteurs pour le verrouillage lors d'un changement de route
    const handleNavStart = () => {
      isNavigationLocked = true;
      // On force la barre à s'ouvrir de manière fluide AVANT le rendu de la nouvelle page
      setShrunk(false);
      if (lockTimeout) clearTimeout(lockTimeout);
    };

    const handleNavEnd = () => {
      // On maintient le verrou pendant 300ms APRÈS la fin de navigation
      // Le temps que l'animation bézier se termine et que le scroll soit stable
      lockTimeout = setTimeout(() => {
        isNavigationLocked = false;
        lastScrollY = window.scrollY; // Réinitialise la référence
      }, 300);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('navigation-start', handleNavStart);
    window.addEventListener('navigation-end', handleNavEnd);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('navigation-start', handleNavStart);
      window.removeEventListener('navigation-end', handleNavEnd);
      if (lockTimeout) clearTimeout(lockTimeout);
    };
  }, []); // Ce hook gère sa propre logique indépendamment de React

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
