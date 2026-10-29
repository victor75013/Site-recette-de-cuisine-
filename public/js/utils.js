/* ============================================================
   utils.js — Fonctions utilitaires partagées et sécurisées
   ============================================================ */

/**
 * Échappe les caractères HTML dangereux (Point 5 de sécurité)
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Valide un ID de recette pour éviter toute injection ou corruption
 */
export function isValidRecipeId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatTime(minutes) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function isServingUnit(unit) {
  if (!unit || typeof unit !== 'string') return true;
  const u = unit.toLowerCase().trim();
  return (
    u === 'personnes' ||
    u === 'portions' ||
    u === 'people' ||
    u === 'servings' ||
    u === 'guests' ||
    u === 'pers.'
  );
}

export function formatServings(qty, unit) {
  if (!qty || qty <= 0) return null;
  const isWeightOrVolume = ['kg', 'g', 'litres', 'cl', 'liters', 'ml'].includes((unit || '').toLowerCase());
  const icon = isWeightOrVolume ? '⚖️' : '👥';
  return `${icon} ${qty} ${unit || ''}`.trim();
}

/**
 * Piège le focus dans un élément pour l'accessibilité clavier (Point 28 A11y)
 */
export function trapFocus(element, onEscape) {
  const focusableEls = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusableEls.length) return () => {};

  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];

  firstEl.focus();

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && typeof onEscape === 'function') {
      onEscape();
      return;
    }
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          lastEl.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastEl) {
          firstEl.focus();
          e.preventDefault();
        }
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  return () => element.removeEventListener('keydown', handleKeyDown);
}
