import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './widgets/sidebar/ui/Sidebar';
import Home from './pages/Home';
import AddEdit from './pages/AddEdit';
import Sites from './pages/Sites';
import Import from './pages/Import';
import Settings from './pages/Settings';
import RecipeView from './pages/RecipeView';
import PageTransition from './shared/ui/PageTransition/PageTransition';
import { ScrollManager } from './app/providers/ScrollManager';
import { ToastContainer } from './shared/ui/Toast/ToastContainer';

// Ce composant écoute les changements de route sans provoquer de re-rendu ailleurs
function AnimatedRoutes() {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      {/* Route de fond (la page derrière la modale) */}
      <AnimatePresence mode="wait">
        <Routes location={backgroundLocation || location} key={(backgroundLocation || location).pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/recipe/:id" element={<RecipeView />} />
          <Route path="/add" element={<PageTransition><AddEdit /></PageTransition>} />
          <Route path="/edit/:id" element={<PageTransition><AddEdit /></PageTransition>} />
          <Route path="/sites" element={<PageTransition><Sites /></PageTransition>} />
          <Route path="/import" element={<PageTransition><Import /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        </Routes>
      </AnimatePresence>

      {/* Routes affichées en mode Modale par-dessus le fond */}
      <AnimatePresence>
        {backgroundLocation && (
          <Routes location={location} key={location.pathname}>
            <Route path="/recipe/:id" element={<RecipeView asModal={true} />} />
          </Routes>
        )}
      </AnimatePresence>
    </>
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
            <AnimatedRoutes />
          </div>
        </main>

      </div>

      <ToastContainer />
    </Router>
  );
}
