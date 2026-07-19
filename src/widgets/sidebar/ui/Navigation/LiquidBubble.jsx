import React from 'react';
import './LiquidBubble.css';

/**
 * Composant purement visuel représentant le "verre dépoli" qui se déplace derrière l'onglet actif.
 * Il délègue toute la logique de positionnement au hook `useLiquidBubble`.
 * 
 * @param {Object} props
 * @param {{ left: number, top: number, width: number, height: number, opacity: number }} props.bubbleStyle - Les coordonnées calculées.
 * @param {boolean} props.isAnimating - Si true, désactive le filtre de flou pour booster les performances (60FPS).
 */
export default function LiquidBubble({ bubbleStyle, isAnimating }) {
  return (
    <div 
      className={`liquid-bubble ${isAnimating ? 'is-animating' : ''}`} 
      style={{ 
        '--bubble-x': `${bubbleStyle.left}px`,
        '--bubble-y': `${bubbleStyle.top}px`,
        width: `${bubbleStyle.width}px`,
        height: `${bubbleStyle.height}px`,
        opacity: bubbleStyle.opacity 
      }} 
    />
  );
}
