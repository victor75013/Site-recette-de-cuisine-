import test from 'node:test';
import assert from 'node:assert/strict';
import { getIngredientEmoji, translateCategory, CATEGORY_FR_TO_EN } from '../public/js/i18n/index.js';
import fr from '../public/js/i18n/fr.js';
import en from '../public/js/i18n/en.js';

test('i18n - les dictionnaires FR et EN ont des clés cohérentes', () => {
  assert.ok(fr['nav.recipes']);
  assert.ok(en['nav.recipes']);
  assert.equal(fr['nav.recipes'], 'Mes Recettes');
  assert.equal(en['nav.recipes'], 'My Recipes');
});

test('getIngredientEmoji - pas de faux-positifs et détection de mots entiers', () => {
  assert.equal(getIngredientEmoji('2 escalopes de poulet'), '🍗');
  assert.equal(getIngredientEmoji('filet de boeuf'), '🥩');
  assert.equal(getIngredientEmoji('pavé de saumon frais'), '🐟');
  assert.equal(getIngredientEmoji('50g de beurre doux'), '🧈');
  assert.equal(getIngredientEmoji('sel et poivre'), '🥄'); // Neutre, pas de faux positif
});

test('translateCategory - mapping exact', () => {
  assert.equal(CATEGORY_FR_TO_EN['Desserts'], 'Desserts');
  assert.equal(CATEGORY_FR_TO_EN['Plats principaux'], 'Main courses');
});
