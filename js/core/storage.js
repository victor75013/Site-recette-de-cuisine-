/* ============================================================
   storage.js — Gestion du stockage des images (Firebase Storage)
   ============================================================ */

const storage = firebase.storage();

/**
 * Télécharge une image depuis une URL externe (via proxy) et l'envoie sur Firebase Storage.
 * @param {string} url - URL de l'image externe
 * @param {string} recipeId - ID de la recette pour nommer le fichier (optionnel)
 * @returns {Promise<string>} - L'URL sécurisée de Firebase Storage
 */
async function ensureImageInStorage(url, recipeId = '') {
  if (!url) return '';
  // Si l'image est déjà sur notre Firebase Storage ou est une data URI (base64 courte), on ne fait rien
  if (url.includes('firebasestorage.googleapis.com') || url.startsWith('data:')) {
    return url;
  }

  console.log("Téléchargement de l'image externe pour stockage permanent...");

  // wsrv.nl est un cache d'image ultra puissant qui contourne presque toutes les protections (Cloudflare, etc.)
  // et renvoie l'image avec les bons headers CORS.
  const cleanUrl = url.replace(/^https?:\/\//, ''); // wsrv.nl accepte l'URL sans le protocole
  const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg&q=80`;

  const proxies = [
    wsrvUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  let blob = null;

  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl);
      if (response.ok) {
        blob = await response.blob();
        break;
      }
    } catch (e) {
      console.warn(`Proxy ${proxyUrl} a échoué:`, e);
    }
  }

  if (!blob) {
    console.error("Tous les proxies ont échoué pour télécharger l'image.");
    // Fallback ultime : on utilise wsrv.nl directement comme URL finale. 
    // Puisque wsrv.nl ajoute les headers CORS, l'extraction de couleur marchera nativement dans le navigateur.
    return wsrvUrl;
  }

  try {
    const userId = currentUser ? currentUser.uid : 'anonymous';
    const filename = recipeId ? `recipe_${recipeId}_${Date.now()}.jpg` : `img_${Date.now()}.jpg`;
    const storageRef = storage.ref(`recipes_images/${userId}/${filename}`);

    await storageRef.put(blob);
    const downloadUrl = await storageRef.getDownloadURL();
    console.log("Image sauvegardée avec succès sur Firebase Storage !", downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error("Échec du stockage de l'image (Firebase), on utilise l'URL wsrv.nl par défaut :", error);
    return wsrvUrl;
  }
}

/**
 * Upload directement un fichier image depuis l'appareil vers Firebase Storage
 * @param {File} file - Fichier sélectionné par l'utilisateur
 * @param {string} recipeId - ID de la recette
 * @returns {Promise<string>} - L'URL sécurisée de Firebase Storage
 */
async function uploadImageFile(file, recipeId = '') {
  if (!file) return '';

  try {
    console.log("Upload du fichier image local...");
    const userId = currentUser ? currentUser.uid : 'anonymous';
    const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const filename = recipeId ? `recipe_${recipeId}_${Date.now()}_${safeName}` : `img_${Date.now()}_${safeName}`;
    const storageRef = storage.ref(`recipes_images/${userId}/${filename}`);

    await storageRef.put(file);
    const downloadUrl = await storageRef.getDownloadURL();
    console.log("Fichier local uploadé avec succès !", downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier :", error);
    throw error;
  }
}
