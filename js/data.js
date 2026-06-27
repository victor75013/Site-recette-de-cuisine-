/* ============================================================
   data.js — Couche données (Firebase Firestore & Auth)
   ============================================================ */

const SETTINGS_KEY = 'carnetRecettes_settings';
const SITES_KEY    = 'carnetRecettes_customSites';
const LEGACY_RECIPES_KEY = 'carnetRecettes_v1';

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

let currentUser = null;

function readLegacyRecipes() {
  try {
    const legacyRecipes = JSON.parse(localStorage.getItem(LEGACY_RECIPES_KEY) || '[]');
    return Array.isArray(legacyRecipes) ? legacyRecipes : [];
  } catch {
    return []; 
  }
}

function mergeRecipeLists(primary, secondary) {
  const merged = new Map();
  for (const recipe of [...secondary, ...primary]) {
    if (!recipe) continue;
    const id = recipe.id || generateId();
    merged.set(id, { ...recipe, id });
  }
  return [...merged.values()];
}

// Auth Listeners
auth.onAuthStateChanged(async user => {
  const previousUser = currentUser;
  currentUser = user;
  const authBtn = document.getElementById('nav-auth');
  const userInfo = document.getElementById('user-info');
  const userAvatar = document.getElementById('user-avatar');
  
  if (user) {
    if (authBtn) authBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (userAvatar) userAvatar.src = user.photoURL || '';

    // Si l'utilisateur vient de se connecter ou si la session a été restaurée
    if (!previousUser || previousUser.uid !== user.uid) {
      cachedRecipes = null; // Vider le cache pour forcer une nouvelle lecture
      await fetchRecipesFromDB();
      if (typeof renderRecipeGrid === 'function' && document.getElementById('recipe-grid')) {
        await renderRecipeGrid();
      }
    }

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
          cachedRecipes = null; // Vider le cache pour forcer une nouvelle lecture après migration
          await fetchRecipesFromDB();
          if (typeof renderRecipeGrid === 'function' && document.getElementById('recipe-grid')) {
            await renderRecipeGrid();
          }
          alert('Migration terminée avec succès !');
        }
      }
    } catch (e) {
      console.error("Erreur de migration locale:", e);
    }

  } else {
    if (authBtn) authBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';

    // Si l'utilisateur s'est déconnecté
    if (previousUser) {
      cachedRecipes = null; // Vider le cache
      await fetchRecipesFromDB();
      if (typeof renderRecipeGrid === 'function' && document.getElementById('recipe-grid')) {
        await renderRecipeGrid();
      }
    }
  }
});

function loginWithGoogle() {
  return auth.signInWithPopup(googleProvider);
}

function logout() {
  return auth.signOut();
}

// ---------- RECETTES (Firestore) ----------

let cachedRecipes = null;

async function fetchRecipesFromDB() {
  try {
    const snapshot = await db.collection('recipes').get();
    const firestoreRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const legacyRecipes = readLegacyRecipes();
    cachedRecipes = firestoreRecipes.length > 0
      ? mergeRecipeLists(firestoreRecipes, legacyRecipes)
      : legacyRecipes;
    // Tri local pour ne pas exclure les recettes sans date
    cachedRecipes.sort((a, b) => {
      const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dB - dA; // Ordre décroissant
    });
    return cachedRecipes;
  } catch (err) {
    console.error("Erreur lecture Firebase:", err);
    const legacyRecipes = readLegacyRecipes();
    if (legacyRecipes.length > 0) {
      cachedRecipes = legacyRecipes;
      cachedRecipes.sort((a, b) => {
        const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dB - dA;
      });
      return cachedRecipes;
    }
    cachedRecipes = [];
    return cachedRecipes;
  }
}

async function getAllRecipes() {
  if (cachedRecipes === null) {
    await fetchRecipesFromDB();
  }
  return cachedRecipes;
}

async function getRecipeById(id) {
  const recipes = await getAllRecipes();
  return recipes.find(r => r.id === id);
}

async function saveRecipe(recipe) {
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

async function deleteRecipe(id) {
  if (!currentUser) throw new Error("Vous devez être connecté pour supprimer une recette.");
  await db.collection('recipes').doc(id).delete();
  await fetchRecipesFromDB();
}

function generateId() {
  // Plus utile avec Firestore qui génère les IDs, mais on le garde par sécurité
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- PARAMÈTRES (Local) ----------

function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}

function saveSettings(settings) {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

// ---------- SITES PERSONNALISÉS (Local) ----------

function getCustomSites() {
  try { return JSON.parse(localStorage.getItem(SITES_KEY)) || []; } catch { return []; }
}

function addCustomSite(site) {
  const sites = getCustomSites();
  sites.push(site);
  localStorage.setItem(SITES_KEY, JSON.stringify(sites));
}

function deleteCustomSite(id) {
  const sites = getCustomSites().filter(s => s.id !== id);
  localStorage.setItem(SITES_KEY, JSON.stringify(sites));
}
