/* ============================================================
   gemini.js — Service centralisé pour les requêtes Gemini IA
   ============================================================ */

import { API_BASE_URL } from '../config.js';

/**
 * Appelle Gemini de manière sécurisée.
 * 1. Essaie d'abord le proxy serveur /api/gemini (clé protégée côté serveur).
 * 2. Si échec ou en mode standalone Netlify, utilise la clé fournie dans l'en-tête HTTP x-goog-api-key.
 */
export async function callGemini(prompt, userApiKey = null) {
  if (!prompt) throw new Error('Prompt requis pour Gemini.');

  // 1. Tentative via le serveur local sécurisé
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (userApiKey) headers['x-goog-api-key'] = userApiKey;

    const res = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(25000)
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  } catch (err) {
    console.warn('[Gemini Service] Serveur indisponible, fallback direct si clé présente:', err.message);
  }

  // 2. Fallback direct client-side (uniquement si une clé est configurée dans les paramètres)
  if (!userApiKey) {
    throw new Error('Aucune clé API Gemini disponible.');
  }

  // Sécurité Point 3 : En-tête x-goog-api-key, jamais de clé dans l'URL
  const directRes = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': userApiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      signal: AbortSignal.timeout(30000)
    }
  );

  if (!directRes.ok) {
    const errText = await directRes.text();
    throw new Error(`Erreur Gemini (${directRes.status}): ${errText}`);
  }

  const directData = await directRes.json();
  return directData.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
