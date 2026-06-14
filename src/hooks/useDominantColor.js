import { useState, useEffect } from 'react';

/**
 * Hook qui analyse l'image ENTIÈRE pour extraire
 * la VRAIE couleur dominante (la plus fréquente) et détermine si le texte doit être clair ou sombre.
 */
export default function useDominantColor(imageUrl) {
  const [colorData, setColorData] = useState({
    bg: 'var(--bg)',      // Fallback au thème de base
    text: 'var(--text)',
    isLight: false,
    ready: false
  });

  useEffect(() => {
    if (!imageUrl) return;

    // Réinitialiser la couleur à chaque nouvelle image
    setColorData(prev => ({ ...prev, ready: false }));

    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Indispensable pour lire le Canvas sans erreur de sécurité CORS
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // On redimensionne l'image entière pour l'analyse (max 100x100 pixels) 
        // pour que l'algorithme soit ultra-rapide
        const scale = Math.min(100 / img.width, 100 / img.height);
        canvas.width = Math.floor(img.width * scale) || 1;
        canvas.height = Math.floor(img.height * scale) || 1;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // Algorithme de fréquence (Quantification par "Buckets")
        const colorBuckets = {};
        let maxCount = 0;
        let dominantBucket = null;

        const bucketSize = 24; // Tolérance pour regrouper les couleurs proches
        const step = 4; // On lit tous les pixels

        for (let i = 0; i < data.length; i += step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3]; // Alpha

          // Ignorer les pixels transparents ou quasi-transparents
          if (a < 128) continue; 

          // Création d'une clé unique pour ce groupe de couleurs
          const bucketKey = `${Math.floor(r / bucketSize)},${Math.floor(g / bucketSize)},${Math.floor(b / bucketSize)}`;
          
          if (!colorBuckets[bucketKey]) {
            colorBuckets[bucketKey] = { count: 0, r: 0, g: 0, b: 0 };
          }
          
          colorBuckets[bucketKey].count++;
          colorBuckets[bucketKey].r += r;
          colorBuckets[bucketKey].g += g;
          colorBuckets[bucketKey].b += b;

          // On garde la trace du bucket qui contient le plus de pixels
          if (colorBuckets[bucketKey].count > maxCount) {
            maxCount = colorBuckets[bucketKey].count;
            dominantBucket = colorBuckets[bucketKey];
          }
        }

        if (!dominantBucket) throw new Error("Image vide");

        // Calcul de la moyenne exacte des pixels dans le bucket dominant
        let r = Math.floor(dominantBucket.r / dominantBucket.count);
        let g = Math.floor(dominantBucket.g / dominantBucket.count);
        let b = Math.floor(dominantBucket.b / dominantBucket.count);

        // Assombrissement léger pour la DA "Spotify" (on évite que le fond soit fluo ou blanc pur)
        r = Math.floor(r * 0.85);
        g = Math.floor(g * 0.85);
        b = Math.floor(b * 0.85);

        // Calcul de luminance perceptuelle (formule standard)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        
        // Seuil : 130 sur 255. Si > 130, le fond est clair, le texte doit être sombre.
        const isLight = luminance > 130; 

        setColorData({
          bg: `rgb(${r}, ${g}, ${b})`,
          text: isLight ? '#1a1a1a' : '#ffffff',
          isLight,
          ready: true
        });

      } catch (e) {
        console.warn("Impossible d'extraire la couleur dominante (erreur CORS). Utilisation du thème par défaut.", e);
      }
    };
  }, [imageUrl]);

  return colorData;
}
