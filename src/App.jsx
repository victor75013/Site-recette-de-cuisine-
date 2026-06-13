import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import AddEdit from './pages/AddEdit';
import Sites from './pages/Sites';
import Import from './pages/Import';
import Settings from './pages/Settings';
import RecipeView from './pages/RecipeView';

// Ce composant écoute les changements de route sans provoquer de re-rendu ailleurs
function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    // 1. On signale au reste de l'app (notamment la Sidebar) qu'une transition commence.
    window.dispatchEvent(new Event('navigation-start'));

    // 2. Retour en haut immédiat dès que la route change
    // Utilisation d'un setTimeout(..., 0) pour s'assurer que le navigateur a fini de calculer le nouveau DOM
    setTimeout(() => {
      // Pour mobile (window / body)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Pour PC (.main-content)
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollTop = 0;
    }, 0);

    // 3. On libère le verrou de la Sidebar après un court délai pour la fluidité
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('navigation-end'));
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}

function ToastContainer() {
  const [toasts, React_useState] = React.useState([]);

  React.useEffect(() => {
    const handleToast = (e) => {
      const newToast = { id: Date.now(), ...e.detail };
      React_useState(prev => [...prev, newToast]);
      setTimeout(() => {
        React_useState(prev => prev.filter(t => t.id !== newToast.id));
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
  return (
    <Router>
      <ScrollManager />
      <div className="app-layout">
        
        {/* COMPOSANT ENCAPSULÉ : gère tout ce qui touche à la barre de navigation (design, auth, scroll) */}
        <Sidebar />

        {/* CONTENU PRINCIPAL */}
        <main className="main-content">
          <div id="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recipe/:id" element={<RecipeView />} />
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
