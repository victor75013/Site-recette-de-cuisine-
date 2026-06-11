import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import AddEdit from './pages/AddEdit';
import Sites from './pages/Sites';
import Import from './pages/Import';
import Settings from './pages/Settings';

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
      <div className="app-layout">
        
        {/* COMPOSANT ENCAPSULÉ : gère tout ce qui touche à la barre de navigation (design, auth, scroll) */}
        <Sidebar />

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
