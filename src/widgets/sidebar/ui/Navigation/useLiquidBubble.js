import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook personnalisé gérant la physique et les animations de la bulle de navigation.
 * Il calcule de manière autonome la position, la taille et l'effet de déformation (squash & stretch)
 * de la bulle de sélection pour offrir un rendu fluide à 60 FPS.
 * 
 * @param {React.MutableRefObject<HTMLElement>} navRef - Référence vers le conteneur <nav> parent.
 * @returns {{
 *   bubbleStyle: { top: number, left: number, width: number, height: number, opacity: number },
 *   isAnimating: boolean,
 *   handleItemClick: (e: React.MouseEvent, isLink?: boolean) => void
 * }}
 */
export function useLiquidBubble(navRef) {
  const bubbleRef = useRef({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });
  const bounceTimerRef = useRef(null);
  const [bubbleStyle, setBubbleStyle] = useState(bubbleRef.current);
  const [isAnimating, setIsAnimating] = useState(false);
  const location = useLocation();

  const applyStyle = (style) => {
    bubbleRef.current = style;
    setBubbleStyle(style);
  };



  /**
   * Recalcule la position cible de la bulle et applique la physique de déplacement.
   * Si la bulle se déplace sur une longue distance, on lui applique un effet d'étirement (squash)
   * pour simuler la vélocité, avant de la faire rebondir à sa position finale.
   * 
   * @param {boolean} animate - Si true, déclenche l'effet de déformation et le timer d'animation.
   */
  const recalcBubble = (animate = false) => {
    if (!navRef.current) return;
    const activeItem = navRef.current.querySelector('.nav-item.active');
    if (!activeItem) return;

    const newTop = activeItem.offsetTop;
    const newLeft = activeItem.offsetLeft;
    const newWidth = activeItem.offsetWidth;
    const newHeight = activeItem.offsetHeight;
    const prev = bubbleRef.current;

    // Annule tout rebond en cours pour éviter les bugs visuels ("téléportation") 
    // en cas de clics rapides consécutifs par l'utilisateur.
    if (bounceTimerRef.current) {
      clearTimeout(bounceTimerRef.current);
    }

    // Apparition initiale ou redimensionnement silencieux de la fenêtre
    if (!animate || prev.opacity === 0) {
      applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
      return;
    }

    const isMobile = window.innerWidth <= 768;
    const distanceX = Math.abs(newLeft - prev.left);
    const distanceY = Math.abs(newTop - prev.top);

    if ((isMobile && distanceX > 0) || (!isMobile && distanceY > 0)) {
      setIsAnimating(true);
      
      // La force de déformation est proportionnelle à la distance parcourue, cappée à 16px.
      const squashY = isMobile ? Math.min(distanceX / 12, 16) : 0;
      const squashX = !isMobile ? Math.min(distanceY / 12, 16) : 0;

      const isMovingRight = newLeft > prev.left;
      const isMovingDown = newTop > prev.top;

      const adjustedLeft = newLeft - (isMovingRight && isMobile ? squashY : 0);
      const adjustedTop = newTop - (isMovingDown && !isMobile ? squashX : 0);

      applyStyle({
        top: adjustedTop,
        left: adjustedLeft,
        width: newWidth - squashX + (isMobile ? squashY : 0),
        height: newHeight - squashY + (!isMobile ? squashX : 0),
        opacity: 1
      });

      // À mi-parcours de la transition CSS (250ms), on relâche l'effet d'étirement 
      // pour que la bulle reprenne sa forme normale en arrivant sur la cible.
      bounceTimerRef.current = setTimeout(() => {
        applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
        setTimeout(() => setIsAnimating(false), 250);
      }, 250);
    } else {
      applyStyle({ top: newTop, left: newLeft, width: newWidth, height: newHeight, opacity: 1 });
    }
  };

  useEffect(() => {
    // Délai de 50ms permettant au DOM de mettre à jour la classe `.active` 
    // et au GPU de préparer le calque d'animation de la barre latérale.
    const t1 = setTimeout(() => {
      recalcBubble(true);
      
      const activeIcon = navRef.current?.querySelector('.nav-item.active .nav-icon');
      if (activeIcon) {
        activeIcon.classList.remove('icon-bounce');
        setTimeout(() => activeIcon.classList.add('icon-bounce'), 10);
      }

      const activeText = navRef.current?.querySelector('.nav-item.active .nav-text');
      if (activeText) {
        activeText.classList.remove('text-bounce');
        setTimeout(() => activeText.classList.add('text-bounce'), 10);
      }
    }, 50);

    const handleResize = () => recalcBubble(false);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname]);

  /**
   * Gère les intéractions sur les éléments de navigation.
   * Assure la re-lecture des animations (rebond) si l'utilisateur clique sur un onglet déjà actif.
   */
  const handleItemClick = (e, isLink = true) => {
    const isAlreadyActive = isLink && e.currentTarget.classList.contains('active');

    if (isAlreadyActive) {
      e.preventDefault();
      // Comportement UX standard : scroller en haut de page lors d'un clic sur l'onglet actif.
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (!isLink || isAlreadyActive) {
      const icon = e.currentTarget.querySelector('.nav-icon');
      if (icon) {
        icon.classList.remove('icon-bounce');
        setTimeout(() => icon.classList.add('icon-bounce'), 10);
      }

      const text = e.currentTarget.querySelector('.nav-text');
      if (text) {
        text.classList.remove('text-bounce');
        setTimeout(() => text.classList.add('text-bounce'), 10);
      }
    }

    if (isAlreadyActive) {
      const bubble = navRef.current.querySelector('.liquid-bubble');
      if (bubble) {
        bubble.classList.remove('bubble-bounce');
        setTimeout(() => bubble.classList.add('bubble-bounce'), 10);
      }
    }
  };

  return { bubbleStyle, isAnimating, handleItemClick };
}
