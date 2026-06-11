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
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <img src="/assets/icons/icon-512.png" alt="Logo" className="brand-icon" style={{width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover'}} />
            <span className="brand-name">Carnet de Recettes</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <Navigation />
            <div className="auth-section">
              {!user ? (
                <button 
                  className="btn btn--sm" 
                  onClick={loginWithGoogle}
                  style={{background:'var(--primary-glow)',color:'var(--primary)',border:'1px solid rgba(249,115,22,0.4)',fontWeight:'800'}}
                >
                  Se connecter
                </button>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <img 
                    src={user.photoURL || ''} 
                    alt="Avatar"
                    style={{width:'36px',height:'36px',borderRadius:'50%',border:'2px solid var(--primary)',objectFit:'cover',boxShadow:'0 2px 8px rgba(249,115,22,0.3)'}} 
                  />
                  <button className="btn btn--sm btn--danger" onClick={logout} style={{padding:'6px 12px',fontSize:'0.75rem'}}>
                    Quitter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
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
      
      <ToastContainer />
    </Router>
  );
}
