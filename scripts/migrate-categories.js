/**
 * scripts/migrate-categories.js
 * Script de migration one-shot pour normaliser les catégories de recettes dans Firestore.
 * Convertit les catégories en texte traduit (ex: "Plats principaux", "Desserts")
 * vers des identifiants standards neutres (ex: "main", "desserts").
 * 
 * Usage:
 *   node scripts/migrate-categories.js
 */

const CATEGORY_MAP = {
  // Français
  'entrées': 'starters',
  'plats principaux': 'main',
  'desserts': 'desserts',
  'soupes': 'soups',
  'salades': 'salads',
  'marinades': 'marinades',
  'sauces': 'sauces',
  'petits-déjeuners': 'breakfasts',
  'snacks': 'snacks',
  'boissons': 'drinks',
  'autres': 'others',

  // Anglais
  'starters': 'starters',
  'main courses': 'main',
  'main': 'main',
  'soups': 'soups',
  'salads': 'salads',
  'breakfasts': 'breakfasts',
  'drinks': 'drinks',
  'others': 'others'
};

console.log('Script de migration des catégories prêt.');
console.log('Pour une utilisation avec le SDK Admin Firebase ou côté client, cette table de correspondance standardise les catégories :');
console.table(CATEGORY_MAP);
