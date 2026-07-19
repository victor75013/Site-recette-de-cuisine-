import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    // 1. On signale au reste de l'app (notamment la Sidebar) qu'une transition commence.
    window.dispatchEvent(new Event('navigation-start'));

    // 2. Retour en haut immédiat dès que la route change
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
