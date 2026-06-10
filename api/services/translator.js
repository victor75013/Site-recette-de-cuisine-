const GT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function translateText(text, to = 'fr') {
  if (!text?.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res  = await fetch(url, { headers: { 'User-Agent': GT_UA } });
    const data = await res.json();
    return data[0]?.map(chunk => chunk[0]).join('') || text;
  } catch { return text; }
}

async function detectLanguage(text) {
  if (!text?.trim()) return 'fr';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fr&dt=t&q=${encodeURIComponent(text.slice(0, 100))}`;
    const res  = await fetch(url, { headers: { 'User-Agent': GT_UA } });
    const data = await res.json();
    return data[2] || 'fr';
  } catch { return 'fr'; }
}

async function translateRecipe(recipe) {
  const sampleText = recipe.title || recipe.description || '';
  const lang = await detectLanguage(sampleText);
  if (lang === 'fr') { 
    console.log(`[Translate] Déjà en français`); 
    return { recipe, translated: false, lang }; 
  }
  console.log(`[Translate] ${lang} → fr : "${recipe.title}"`);
  const [title, description, ...ingredientsTranslated] = await Promise.all([
    translateText(recipe.title), 
    translateText(recipe.description), 
    ...(recipe.ingredients || []).map(i => translateText(i))
  ]);
  const steps = await Promise.all((recipe.steps || []).map(s => translateText(s)));
  const translatedRecipe = { ...recipe, title, description, ingredients: ingredientsTranslated, steps };
  console.log(`[Translate OK] "${title}"`);
  return { recipe: translatedRecipe, translated: true, lang };
}

module.exports = { translateRecipe };
