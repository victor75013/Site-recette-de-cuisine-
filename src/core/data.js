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
  
  if (!recipe.id) {
    // Nouvelle recette
    recipe.createdAt = now;
    recipe.updatedAt = now;
    recipe.createdBy = currentUser.uid;
    const docRef = await db.collection('recipes').add(recipe);
    recipe.id = docRef.id;
  } else {
    // Mise à jour ou Import
    const { id, ...dataToUpdate } = recipe;
    dataToUpdate.updatedAt = now;
    if (!dataToUpdate.createdAt) dataToUpdate.createdAt = now;
    if (!dataToUpdate.createdBy) dataToUpdate.createdBy = currentUser.uid;
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

export function generateId() {
  // Plus utile avec Firestore qui génère les IDs, mais on le garde par sécurité
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- PARAMÈTRES (Local) ----------

export function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}

export function saveSettings(settings) {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

// ---------- SITES PERSONNALISÉS (Local) ----------

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
