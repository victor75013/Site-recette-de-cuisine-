import { useMemo } from 'react';
import Fuse from 'fuse.js';

export function useRecipeSearch(recipes, search, activeFilter) {
  const categoryFiltered = useMemo(() => {
    return recipes.filter(r => {
      return activeFilter === 'Tout' || 
             r.category === activeFilter ||
             (r.tags && r.tags.includes(activeFilter)) ||
             (activeFilter === 'Healthy' && r.title?.toLowerCase().includes('healthy')) ||
             (activeFilter === 'Rapide' && r.title?.toLowerCase().includes('rapide'));
    });
  }, [recipes, activeFilter]);

  const isChefSearch = search.startsWith('@');
  const actualSearchTerm = isChefSearch ? search.substring(1).trim() : search;

  // Cerveau de Recherche Approximative (Fuse.js)
  const fuse = useMemo(() => {
    return new Fuse(categoryFiltered, {
      keys: isChefSearch ? [
        { name: 'author.name', weight: 2 },
        { name: 'author', weight: 2 }
      ] : [
        { name: 'title', weight: 2 },
        { name: 'category', weight: 1 },
        { name: 'tags', weight: 0.5 }
      ],
      threshold: 0.4, // Tolérance augmentée pour les petits mots (noms)
      ignoreLocation: true
    });
  }, [categoryFiltered, isChefSearch]);

  const filteredRecipes = actualSearchTerm 
    ? fuse.search(actualSearchTerm).map(result => result.item)
    : categoryFiltered;

  return filteredRecipes;
}
