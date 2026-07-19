import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRecipes, deleteRecipe, saveRecipe, currentUser, generateId } from '../../../shared/api/data';
import { showToast } from '../../../shared/lib/utils';

export function useDataManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      const recipes = await getAllRecipes();
      const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `recettes_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      showToast('Export téléchargé !', 'success');
    } catch (err) {
      showToast('Erreur lors de l\'export: ' + err.message, 'error');
    }
  };

  const triggerImport = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error('Format invalide.');
        if (!currentUser) throw new Error('Vous devez être connecté pour importer.');
        
        let count = 0;
        for (const r of imported) { 
          if (r.title) { 
            await saveRecipe({ ...r, id: r.id || generateId() }); 
            count++; 
          } 
        }
        showToast(`${count} recette(s) importée(s) !`, 'success');
        navigate('/');
      } catch (err) { 
        showToast('Erreur import : ' + err.message, 'error'); 
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleUpdateImported = async () => {
    if (!currentUser) return showToast('Vous devez être connecté.', 'error');
    try {
      const recipes = await getAllRecipes();
      const myImportedRecipes = recipes.filter(r => r.createdBy === currentUser.uid && r.sourceUrl && r.sourceUrl.trim() !== '');
      if (myImportedRecipes.length === 0) return showToast('Aucune recette importée trouvée.', 'info');
      if (!window.confirm(`Voulez-vous actualiser les données de vos ${myImportedRecipes.length} recettes importées ? (Cela peut prendre plusieurs minutes)`)) return;
      
      showToast(`Actualisation en cours... Veuillez patienter.`, 'info');
      let successCount = 0;
      for (const r of myImportedRecipes) {
        try {
          const res = await fetch('http://localhost:3001/scrape', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: r.sourceUrl.trim() }),
          });
          if (res.ok) {
            const data = await res.json();
            await saveRecipe({
              ...r,
              title: data.title || r.title,
              description: data.description || r.description,
              imageUrl: data.image || r.imageUrl,
              prepTime: data.prepTime || r.prepTime,
              cookTime: data.cookTime || r.cookTime,
              servings: data.servings || r.servings,
              ingredients: data.ingredients?.length ? data.ingredients : r.ingredients,
              steps: data.instructions?.length ? data.instructions : r.steps,
            });
            successCount++;
          }
        } catch (e) { console.error('Erreur', e); }
      }
      showToast(`${successCount}/${myImportedRecipes.length} recettes actualisées !`, 'success');
      navigate('/');
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
  };

  const handleResetData = async () => {
    if (!currentUser) {
      showToast('Vous devez être connecté.', 'error');
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer toutes VOS recettes du cloud ? Cette action est irréversible.')) {
      try {
        const recipes = await getAllRecipes();
        const myRecipes = recipes.filter(r => r.createdBy === currentUser.uid);
        for (const r of myRecipes) {
          await deleteRecipe(r.id);
        }
        showToast('Vos recettes ont été supprimées.', 'info');
        navigate('/');
      } catch(err) {
        showToast('Erreur: ' + err.message, 'error');
      }
    }
  };

  return {
    fileInputRef,
    handleExport,
    triggerImport,
    handleImportFile,
    handleUpdateImported,
    handleResetData
  };
}
