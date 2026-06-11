import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import AddEdit from './pages/AddEdit';
import Sites from './pages/Sites';
import Import from './pages/Import';
import Settings from './pages/Settings';
import { onAuthChange, loginWithGoogle, logout } from './core/data';

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const newToast = { id: Date.now(), ...e.detail };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration || 3500);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span>{icons[t.type] || ''}</span> {t.message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app-layout">
        
        {/* BARRE LATÉRALE (Desktop) / BARRE DU BAS (Mobile) */}
        <aside className="sidebar">
          
          <div className="sidebar-top">
            <div className="brand">
              <img src="/assets/icons/icon-512.png" alt="Logo" className="brand-icon" />
              <span className="brand-name">Carnet de Recettes</span>
            </div>
          </div>

          <div className="sidebar-middle">
            <Navigation />
          </div>

          <div className="sidebar-bottom">
            <div className="auth-section">
              {!user ? (
                <button className="btn btn--sm btn--auth" onClick={loginWithGoogle}>
                  <span className="auth-icon">🔑</span>
                  <span className="auth-text">Connexion</span>
                </button>
              ) : (
                <div className="auth-user">
                  <img src={user.photoURL || ''} alt="Avatar" className="auth-avatar" />
                  <button className="btn btn--sm btn--danger btn--auth" onClick={logout}>
                    <span className="auth-icon">🚪</span>
                    <span className="auth-text">Quitter</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </aside>

        {/* CONTENU PRINCIPAL */}
        <main className="main-content">
          <div id="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddEdit />} />
              <Route path="/edit/:id" element={<AddEdit />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/import" element={<Import />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>

      </div>
      
      <ToastContainer />
    </Router>
  );
}
