/* ============================================================
   colorExtractor.js — Extraction de la couleur dominante d'une image
   Utilise Canvas API pour lire les pixels et calculer la couleur
   la plus saturée et lumineuse (style Apple Music).
   ============================================================ */

/**
 * Extrait la couleur dominante d'une image via Canvas.
 * Retourne un objet { r, g, b } ou null si échec.
 * @param {HTMLImageElement} img
 * @returns {{ r: number, g: number, b: number } | null}
 */
export function extractDominantColor(img) {
  try {
    const canvas = document.createElement('canvas');
    const SIZE = 64; // Downsample pour performance
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, SIZE, SIZE);

    const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

    let bestColor = null;
    let bestScore = -1;

    // Quantification simple : on échantillonne les pixels et on choisit
    // le plus "vibrant" (saturé + lumineux, mais pas trop sombre ni trop clair)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 128) continue; // Ignore pixels transparents

      const { h, s, l } = rgbToHsl(r, g, b);

      // Filtre : on veut des couleurs saturées et ni trop sombres ni trop claires
      if (s < 0.25 || l < 0.15 || l > 0.85) continue;

      // Score : favorise la saturation et une luminosité "médiane"
      const score = s * (1 - Math.abs(l - 0.45));

      if (score > bestScore) {
        bestScore = score;
        bestColor = { r, g, b };
      }
    }

    // Fallback : si aucune couleur vibrante trouvée, prend la moyenne
    if (!bestColor) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        sumR += data[i]; sumG += data[i + 1]; sumB += data[i + 2];
        count++;
      }
      if (count > 0) {
        bestColor = {
          r: Math.round(sumR / count),
          g: Math.round(sumG / count),
          b: Math.round(sumB / count)
        };
      }
    }

    return bestColor;
  } catch (e) {
    // CORS ou autre erreur
    return null;
  }
}

/**
 * Convertit RGB en HSL.
 */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h, s, l };
}

/**
 * Applique la couleur dominante d'une image sur une carte recette.
 * @param {HTMLElement} card — L'élément .recipe-card
 * @param {string} imageUrl — L'URL de l'image
 */
export async function applyDominantColorToCard(card, imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const color = extractDominantColor(img);
      if (color) {
        const { r, g, b } = color;
        card.style.setProperty('--card-dominant-r', r);
        card.style.setProperty('--card-dominant-g', g);
        card.style.setProperty('--card-dominant-b', b);
        card.classList.add('has-dominant-color');
      }
      resolve(color);
    };

    img.onerror = () => resolve(null);

    // Ajout d'un paramètre pour éviter que la requête CORS n'interfère avec le cache de l'image principale
    // Optionnel : on pourrait utiliser un proxy CORS ici si les images viennent de CDN stricts
    const separator = imageUrl.includes('?') ? '&' : '?';
    img.src = imageUrl + separator + 'cors-bypass=' + Date.now();
  });
}

/**
 * Applique la couleur dominante sur toutes les cartes visibles dans la grille.
 */
export async function applyDominantColorsToGrid() {
  const cards = document.querySelectorAll('.recipe-card[data-id]');
  const promises = [];

  cards.forEach(card => {
    const img = card.querySelector('.card-image');
    if (img && img.src) {
      promises.push(applyDominantColorToCard(card, img.src));
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Applique la couleur dominante de l'image sur la modal de détail.
 * Définit --modal-dominant-r/g/b sur l'élément .modal
 * @param {string} imageUrl — L'URL de l'image de la recette
 */
export async function applyDominantColorToModal(imageUrl) {
  const modal = document.getElementById('modal');
  if (!modal || !imageUrl) return;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const color = extractDominantColor(img);
      if (color) {
        const { r, g, b } = color;
        modal.style.setProperty('--modal-dominant-r', r);
        modal.style.setProperty('--modal-dominant-g', g);
        modal.style.setProperty('--modal-dominant-b', b);
      }
      resolve(color);
    };

    img.onerror = () => resolve(null);
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    img.src = imageUrl + separator + 'cors-bypass=' + Date.now();
  });
}
