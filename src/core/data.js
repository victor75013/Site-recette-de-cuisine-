/* ============================================================
   data.js — Couche données (Firebase Firestore & Auth)
   ============================================================ */

const SETTINGS_KEY = 'carnetRecettes_settings';
const SITES_KEY    = 'carnetRecettes_customSites';

const firebaseConfig = {
  apiKey: "AIzaSyAvuPpHvqpOxSU1RrQlQxamqMoqVVnk3Bk",
  authDomain: "carnet-de-recette-71be0.firebaseapp.com",
  projectId: "carnet-de-recette-71be0",
  storageBucket: "carnet-de-recette-71be0.firebasestorage.app",
  messagingSenderId: "680761552538",
  appId: "1:680761552538:web:3c692df9ae4b5ad5fef923"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Activer le mode hors-ligne de Firebase (Offline Persistence)
db.enablePersistence().catch(function(err) {
  if (err.code === 'failed-precondition') {
    console.warn("Le mode hors-ligne ne fonctionne que dans un seul onglet à la fois.");
  } else if (err.code === 'unimplemented') {
    console.warn("Le navigateur ne supporte pas le mode hors-ligne de Firebase.");
  }
});
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

export let currentUser = null;

// Auth Listeners
let authCallbacks = [];

export function onAuthChange(callback) {
  authCallbacks.push(callback);
  if (currentUser !== undefined) callback(currentUser);
  return () => { authCallbacks = authCallbacks.filter(cb => cb !== callback); };
}

auth.onAuthStateChanged(async user => {
  currentUser = user;
  
  if (user) {
    // ─── CRÉATION/MISE À JOUR DU PROFIL PUBLIC ───
    const userRef = db.collection('users').doc(user.uid);
    userRef.set({
      uid: user.uid,
      displayName: user.displayName || 'Utilisateur',
      photoURL: user.photoURL || '',
      lastLogin: new Date().toISOString()
    }, { merge: true }).catch(console.error);

    // MIGRATION AUTOMATIQUE DES RECETTES LOCALES
    try {
      const localRecipes = JSON.parse(localStorage.getItem('carnetRecettes_v1') || '[]');
      if (localRecipes.length > 0) {
        if (confirm(`Nous avons trouvé ${localRecipes.length} recettes enregistrées localement sur votre ordinateur. Voulez-vous les envoyer sur votre nouveau carnet partagé en ligne ?`)) {
          for (const r of localRecipes) {
            r.createdBy = user.uid;
            r.createdAt = r.createdAt || new Date().toISOString();
            await db.collection('recipes').doc(r.id).set(r);
          }
          localStorage.removeItem('carnetRecettes_v1'); // On nettoie
          await fetchRecipesFromDB();
          const event = new CustomEvent('show-toast', { detail: { message: 'Migration terminée avec succès !', type: 'success' } });
          window.dispatchEvent(event);
        }
      }
    } catch (e) {
      console.error("Erreur de migration locale:", e);
    }
  }

  // Notify React components
  authCallbacks.forEach(cb => cb(user));
});

export function loginWithGoogle() {
  return auth.signInWithPopup(googleProvider);
}

export function logout() {
  return auth.signOut();
}

// ---------- PROFILS UTILISATEURS (Social) ----------

export async function getUserProfile(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch (err) {
    console.error("Erreur getUserProfile:", err);
    return null;
  }
}

export async function updateUserProfile(data) {
  if (!currentUser) throw new Error("Non connecté");
  await db.collection('users').doc(currentUser.uid).set(data, { merge: true });
}

// ---------- RECETTES (Firestore) ----------

let cachedRecipes = [];

export async function fetchRecipesFromDB() {
  try {
    const snapshot = await db.collection('recipes').get();
    cachedRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Tri local pour ne pas exclure les recettes sans date
    cachedRecipes.sort((a, b) => {
      const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dB - dA; // Ordre décroissant
    });
    return cachedRecipes;
  } catch (err) {
    console.error("Erreur lecture Firebase:", err);
    return cachedRecipes;
  }
}

// Récupère uniquement les recettes publiques (Le "Feed" Social)
export async function getPublicRecipes() {
  try {
    const snapshot = await db.collection('recipes')
      // TEMPORAIRE : On commente le filtre pour voir les anciennes recettes privées
      // .where('isPublic', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Erreur getPublicRecipes:", err);
    return [];
  }
}

export async function getAllRecipes() {
  if (cachedRecipes.length === 0) {
    await fetchRecipesFromDB();
  }
  return cachedRecipes;
}

export async function getRecipeById(id) {
  const recipes = await getAllRecipes();
  return recipes.find(r => r.id === id);
}

export async function saveRecipe(recipe) {
  if (!currentUser) throw new Error("Vous devez être connecté pour enregistrer une recette.");
  
  const now = new Date().toISOString();
  
  // Dénormalisation de l'auteur pour un affichage ultra rapide dans le Feed
  const authorData = {
    uid: currentUser.uid,
    name: currentUser.displayName || 'Utilisateur',
    photoURL: currentUser.photoURL || ''
  };

  if (!recipe.id) {
    // Nouvelle recette
    recipe.createdAt = now;
    recipe.updatedAt = now;
    recipe.createdBy = currentUser.uid;
    recipe.author = authorData;
    recipe.isPublic = recipe.isPublic !== undefined ? recipe.isPublic : false;
    recipe.likesCount = 0;
    recipe.commentsCount = 0;
    const docRef = await db.collection('recipes').add(recipe);
    recipe.id = docRef.id;
  } else {
    // Mise à jour ou Import
    const { id, ...dataToUpdate } = recipe;
    dataToUpdate.updatedAt = now;
    if (!dataToUpdate.createdAt) dataToUpdate.createdAt = now;
    if (!dataToUpdate.createdBy) dataToUpdate.createdBy = currentUser.uid;
    if (!dataToUpdate.author) dataToUpdate.author = authorData;
    await db.collection('recipes').doc(id).set(dataToUpdate, { merge: true });
  }
  
  await fetchRecipesFromDB(); // Rafraîchir le cache
  return recipe;
}

export async function deleteRecipe(id) {
  if (!currentUser) throw new Error("Vous devez être connecté pour supprimer une recette.");
  await db.collection('recipes').doc(id).delete();
  await fetchRecipesFromDB();
}

// ---------- INTERACTIONS SOCIALES (Likes, Commentaires, Saves) ----------

export async function hasUserLiked(recipeId) {
  if (!currentUser) return false;
  try {
    const doc = await db.collection('recipes').doc(recipeId)
      .collection('likes').doc(currentUser.uid).get();
    return doc.exists;
  } catch (err) {
    return false;
  }
}

export async function toggleLike(recipeId) {
  if (!currentUser) throw new Error("Vous devez être connecté pour aimer une recette.");
  
  const likeRef = db.collection('recipes').doc(recipeId).collection('likes').doc(currentUser.uid);
  const recipeRef = db.collection('recipes').doc(recipeId);

  // Transaction atomique pour éviter les conflits si plusieurs cliquent en même temps
  return db.runTransaction(async (transaction) => {
    const likeDoc = await transaction.get(likeRef);
    if (!likeDoc.exists) {
      transaction.set(likeRef, { createdAt: new Date().toISOString() });
      transaction.update(recipeRef, { likesCount: firebase.firestore.FieldValue.increment(1) });
      return true; // Liké
    } else {
      transaction.delete(likeRef);
      transaction.update(recipeRef, { likesCount: firebase.firestore.FieldValue.increment(-1) });
      return false; // Unliké
    }
  });
}

export async function getComments(recipeId) {
  try {
    const snapshot = await db.collection('recipes').doc(recipeId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Erreur getComments:", err);
    return [];
  }
}

export async function addComment(recipeId, text) {
  if (!currentUser) throw new Error("Vous devez être connecté pour commenter.");
  if (!text || text.trim() === '') throw new Error("Le commentaire est vide.");

  const commentRef = db.collection('recipes').doc(recipeId).collection('comments').doc();
  const recipeRef = db.collection('recipes').doc(recipeId);

  const commentData = {
    text: text.trim(),
    authorId: currentUser.uid,
    authorName: currentUser.displayName || 'Utilisateur',
    authorPhoto: currentUser.photoURL || '',
    createdAt: new Date().toISOString()
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(commentRef, commentData);
    transaction.update(recipeRef, { commentsCount: firebase.firestore.FieldValue.increment(1) });
  });

  return { id: commentRef.id, ...commentData };
}

export async function saveRecipeToBook(recipeId) {
  if (!currentUser) throw new Error("Connectez-vous pour sauvegarder une recette.");
  const savedRef = db.collection('users').doc(currentUser.uid).collection('saved_recipes').doc(recipeId);
  
  const doc = await savedRef.get();
  if (!doc.exists) {
    await savedRef.set({ savedAt: new Date().toISOString(), recipeId });
    return true; // ajouté aux favoris
  } else {
    await savedRef.delete();
    return false; // retiré des favoris
  }
}

// ---------- UTILITAIRES ----------

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- PARAMÈTRES & SITES (Local) ----------

export function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}

export function saveSettings(settings) {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

export function getCustomSites() {
  try { return JSON.parse(localStorage.getItem(SITES_KEY)) || []; } catch { return []; }
}

export function addCustomSite(site) {
  const sites = getCustomSites();
  sites.push(site);
  localStorage.setItem(SITES_KEY, JSON.stringify(sites));
}

export function deleteCustomSite(id) {
  const sites = getCustomSites().filter(s => s.id !== id);
  localStorage.setItem(SITES_KEY, JSON.stringify(sites));
}
