import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, formatTime, formatServings, isServingUnit, isValidRecipeId } from '../public/js/utils.js';

test('escapeHtml - neutralise les balises et caractères sensibles', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml("l'oeuf & le poisson"), 'l&#039;oeuf &amp; le poisson');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('formatTime - formate les durées en minutes et heures', () => {
  assert.equal(formatTime(0), null);
  assert.equal(formatTime(-5), null);
  assert.equal(formatTime(25), '25 min');
  assert.equal(formatTime(60), '1h');
  assert.equal(formatTime(75), '1h15');
  assert.equal(formatTime(125), '2h05');
});

test('isServingUnit - détecte correctement les portions de personnes', () => {
  assert.equal(isServingUnit('personnes'), true);
  assert.equal(isServingUnit('portions'), true);
  assert.equal(isServingUnit('people'), true);
  assert.equal(isServingUnit('kg'), false);
  assert.equal(isServingUnit('litres'), false);
});

test('formatServings - formate avec la bonne icône', () => {
  assert.equal(formatServings(4, 'personnes'), '👥 4 personnes');
  assert.equal(formatServings(500, 'g'), '⚖️ 500 g');
  assert.equal(formatServings(0, 'personnes'), null);
});

test('isValidRecipeId - valide les identifiants sûrs', () => {
  assert.equal(isValidRecipeId('recipe_123'), true);
  assert.equal(isValidRecipeId('a-b-c'), true);
  assert.equal(isValidRecipeId('<script>'), false);
  assert.equal(isValidRecipeId(''), false);
  assert.equal(isValidRecipeId(null), false);
});
