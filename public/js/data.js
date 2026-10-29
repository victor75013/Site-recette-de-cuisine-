/* ============================================================
   data.js — Couche de données (Firebase Firestore & Auth)
   ============================================================ */

import { STORAGE_KEYS } from './config.js';
import { generateId, isValidRecipeId } from './utils.js';

const firebaseConfig = {
  apiKey: "AIzaSyAvuPpHvqpOxSU1RrQlQxamqMoqVVnk3Bk",
  authDomain: "carnet-de-recette-71be0.firebaseapp.com",
  projectId: "carnet-de-recette-71be0",
  storageBucket: "carnet-de-recette-71be0.firebasestorage.app",
  messagingSenderId: "680761552538",
  appId: "1:680761552538:web:3c692df9ae4b5ad5fef923"
};

// Initialisation Firebase Compat
if (!window.firebase.apps.length) {
  window.firebase.initializeApp(firebaseConfig);
}
export const db = window.firebase.firestore();

// Mode persistance hors-ligne Firestore
db.enablePersistence().catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[Firestore] Persistance active uniquement dans un seul onglet.');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firestore] Navigateur incompatible avec la persistance.');
  }
});

export const auth = window.firebase.auth();
const googleProvider = new window.firebase.auth.GoogleAuthProvider();

export let currentUser = null;
let cachedRecipes = null;

export function initAuth(onUserChange) {
  auth.onAuthStateChanged(async (user) => {
    const previousUser = currentUser;
    currentUser = user;

    const authBtn = document.getElementById('nav-auth');
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');

    if (user) {
      if (authBtn) authBtn.classList.add('u-hidden');
      if (userInfo) userInfo.style.display = 'flex';
      if (userAvatar) userAvatar.src = user.photoURL || '';

      if (!previousUser || previousUser.uid !== user.uid) {
        cachedRecipes = null;
        await fetchRecipesFromDB();
        if (typeof onUserChange === 'function') onUserChange(user);
      }
    } else {
      if (authBtn) authBtn.classList.remove('u-hidden');
      if (userInfo) userInfo.style.display = 'none';

      if (previousUser) {
        cachedRecipes = null;
        await fetchRecipesFromDB();
        if (typeof onUserChange === 'function') onUserChange(null);
      }
    }
  });
}

export function loginWithGoogle() {
  return auth.signInWithPopup(googleProvider);
}

export function logout() {
  return auth.signOut();
}

export async function fetchRecipesFromDB() {
  try {
    const snapshot = await db.collection('recipes').get();
    const firestoreRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    cachedRecipes = firestoreRecipes;
    cachedRecipes.sort((a, b) => {
      const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dB - dA;
    });

    return cachedRecipes;
  } catch (err) {
    console.error('[Firebase] Erreur lecture Firestore:', err);
    cachedRecipes = cachedRecipes || [];
    return cachedRecipes;
  }
}

export async function getAllRecipes() {
  if (cachedRecipes === null) {
    await fetchRecipesFromDB();
  }
  return cachedRecipes;
}

export async function getRecipeById(id) {
  const recipes = await getAllRecipes();
  return recipes.find(r => r.id === id);
}

/**
 * Sauvegarde avec mise à jour optimiste du cache local (Point 12)
 */
export async function saveRecipe(recipe) {
  if (!currentUser) throw new Error('Vous devez être connecté pour enregistrer une recette.');

  const now = new Date().toISOString();
  let savedId = recipe.id;

  if (!savedId) {
    recipe.createdAt = now;
    recipe.updatedAt = now;
    recipe.createdBy = currentUser.uid;
    const docRef = await db.collection('recipes').add(recipe);
    recipe.id = docRef.id;
    savedId = docRef.id;

    if (cachedRecipes) {
      cachedRecipes.unshift({ ...recipe });
    }
  } else {
    if (!isValidRecipeId(savedId)) throw new Error('Identifiant de recette non valide.');
    const { id, ...dataToUpdate } = recipe;
    dataToUpdate.updatedAt = now;
    if (!dataToUpdate.createdAt) dataToUpdate.createdAt = now;
    if (!dataToUpdate.createdBy) dataToUpdate.createdBy = currentUser.uid;

    await db.collection('recipes').doc(savedId).set(dataToUpdate, { merge: true });

    if (cachedRecipes) {
      const idx = cachedRecipes.findIndex(r => r.id === savedId);
      if (idx !== -1) {
        cachedRecipes[idx] = { ...recipe, ...dataToUpdate, id: savedId };
      } else {
        cachedRecipes.unshift({ ...recipe, ...dataToUpdate, id: savedId });
      }
    }
  }

  return recipe;
}

/**
 * Suppression avec mise à jour immédiate du cache local (Point 12)
 */
export async function deleteRecipe(id) {
  if (!currentUser) throw new Error('Vous devez être connecté pour supprimer une recette.');
  if (!isValidRecipeId(id)) throw new Error('ID invalide.');

  await db.collection('recipes').doc(id).delete();

  if (cachedRecipes) {
    cachedRecipes = cachedRecipes.filter(r => r.id !== id);
  }
}

// ---------- PARAMÈTRES (LocalStorage) ----------

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  const current = getSettings();
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
}

// ---------- SITES PERSONNALISÉS (LocalStorage) ----------

export function getCustomSites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SITES)) || [];
  } catch {
    return [];
  }
}

export function addCustomSite(site) {
  const sites = getCustomSites();
  sites.push(site);
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
}

export function deleteCustomSite(id) {
  const sites = getCustomSites().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
}
