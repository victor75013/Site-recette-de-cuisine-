const puppeteer = require('puppeteer');

async function scrapeUrl(url) {
  if (!url || !url.startsWith('http')) {
    throw new Error('URL invalide.');
  }
  console.log(`[Scrape] ${url}`);
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => { 
      Object.defineProperty(navigator, 'webdriver', { get: () => false }); 
    });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));
    
    const recipeData = await page.evaluate(() => {
      let recipe = null;
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.innerText);
          const findRecipe = (obj) => {
            if (!obj) return null;
            if (Array.isArray(obj)) {
              for (const item of obj) {
                const res = findRecipe(item);
                if (res) return res;
              }
            } else if (typeof obj === 'object') {
              if (obj['@type'] === 'Recipe' || (Array.isArray(obj['@type']) && obj['@type'].includes('Recipe'))) {
                return obj;
              }
              if (obj['@graph']) {
                return findRecipe(obj['@graph']);
              }
            }
            return null;
          };
          const found = findRecipe(data);
          if (found) {
            recipe = found;
            break;
          }
        } catch(e) {}
      }
      
      const title = recipe?.name || document.querySelector('meta[property="og:title"]')?.content || document.title || '';
      const description = recipe?.description || document.querySelector('meta[property="og:description"]')?.content || '';
      
      let image = '';
      if (recipe && recipe.image) {
        if (typeof recipe.image === 'string') image = recipe.image;
        else if (Array.isArray(recipe.image)) image = typeof recipe.image[0] === 'string' ? recipe.image[0] : recipe.image[0]?.url || '';
        else if (recipe.image.url) image = recipe.image.url;
      }
      if (!image) {
        image = document.querySelector('meta[property="og:image"]')?.content || '';
      }

      let ingredients = [];
      if (recipe && recipe.recipeIngredient) {
        ingredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [recipe.recipeIngredient];
      }

      let instructions = [];
      if (recipe && recipe.recipeInstructions) {
        const inst = recipe.recipeInstructions;
        if (Array.isArray(inst)) {
          instructions = inst.map(i => i.text || i.name || '').filter(Boolean);
        } else if (typeof inst === 'string') {
          instructions = [inst];
        }
      }

      const parseDuration = (isoStr) => {
        if (!isoStr) return 0;
        const match = isoStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return 0;
        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        return hours * 60 + minutes;
      };

      return {
        title,
        description,
        image,
        ingredients,
        instructions,
        prepTime: recipe ? parseDuration(recipe.prepTime) : 0,
        cookTime: recipe ? parseDuration(recipe.cookTime) : 0,
        servings: recipe && recipe.recipeYield 
          ? (typeof recipe.recipeYield === 'string' ? parseInt(recipe.recipeYield) : (Array.isArray(recipe.recipeYield) ? parseInt(recipe.recipeYield[0]) : 0))
          : 0
      };
    });

    const finalUrl = page.url();
    console.log(`[OK] ${finalUrl} - Image: ${recipeData.image}`);
    return { ...recipeData, url: finalUrl, html: await page.content() };
  } catch (err) { 
    console.error(`[Erreur scrape] ${err.message}`); 
    throw err;
  } finally { 
    if (browser) await browser.close(); 
  }
}

module.exports = { scrapeUrl };
