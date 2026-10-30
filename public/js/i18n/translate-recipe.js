/* ============================================================
   i18n/translate-recipe.js — Service de traduction des recettes
   ============================================================ */

import { getLang, CATEGORY_FR_TO_EN } from './index.js';
import { STORAGE_KEYS, API_BASE_URL } from '../config.js';
import { callGemini } from '../services/gemini.js';
import { getSettings } from '../data.js';
import { getIngredientText } from '../nutrition.js';

export function getTranslationCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSLATIONS_CACHE) || '{}');
  } catch {
    return {};
  }
}

export function setTranslationCache(cache) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSLATIONS_CACHE, JSON.stringify(cache));
  } catch (e) {
    console.warn('[TransCache] Erreur écriture cache:', e);
  }
}

export function clearRecipeTranslation(recipeId) {
  const cache = getTranslationCache();
  delete cache[recipeId];
  setTranslationCache(cache);
}

export async function translateTextClient(text, targetLang = 'en') {
  if (!text || !text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return text;
    const data = await res.json();
    return data[0]?.map(chunk => chunk[0]).join('') || text;
  } catch {
    return text;
  }
}

export async function translateRecipeViaGoogle(recipe, targetLang = 'en') {
  const DELIM = '\n=====\n';
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const items = [
    recipe.title || '',
    recipe.description || '',
    ...ingredients.map(getIngredientText),
    '___STEPS_DELIM___',
    ...steps,
  ];

  try {
    const joined = items.join(DELIM);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(joined)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const data = await res.json();
      const text = data[0]?.map(chunk => chunk[0]).join('') || '';
      const parts = text.split(DELIM).map(s => s.trim());
      const sepIdx = parts.indexOf('___STEPS_DELIM___');
      if (sepIdx !== -1) {
        return {
          title: parts[0] || recipe.title,
          description: parts[1] || recipe.description,
          ingredients: parts.slice(2, sepIdx),
          steps: parts.slice(sepIdx + 1),
          category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category,
        };
      }
    }
  } catch (err) {
    console.warn('[translateRecipeViaGoogle] Fallback individuel:', err.message);
  }

  return {
    ...recipe,
    category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category,
  };
}

export async function translateRecipeForDisplay(recipe) {
  if (getLang() !== 'en' || !recipe || !recipe.id) return recipe;

  const cache = getTranslationCache();
  if (cache[recipe.id] && cache[recipe.id].ingredients?.length) {
    return { ...recipe, ...cache[recipe.id] };
  }

  // 1. Essai direct via Google Translate rapide
  try {
    const tr = await translateRecipeViaGoogle(recipe, 'en');
    if (tr && tr.title) {
      cache[recipe.id] = tr;
      setTranslationCache(cache);
      return { ...recipe, ...tr };
    }
  } catch {}

  // 2. Essai via le serveur local /api/translate
  try {
    const res = await fetch(`${API_BASE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe, targetLang: 'en' }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.recipe) {
        cache[recipe.id] = data.recipe;
        setTranslationCache(cache);
        return { ...recipe, ...data.recipe };
      }
    }
  } catch {}

  return {
    ...recipe,
    category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category
  };
}

export function getCachedTranslation(recipe) {
  if (getLang() !== 'en' || !recipe?.id) return recipe;
  const cache = getTranslationCache();
  if (cache[recipe.id]) return { ...recipe, ...cache[recipe.id] };
  return { ...recipe, category: CATEGORY_FR_TO_EN[recipe.category] || recipe.category };
}
