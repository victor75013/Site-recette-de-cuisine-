import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveSettings, getAllRecipes, deleteRecipe, saveRecipe, currentUser, generateId } from '../core/data';
import { showToast } from '../core/utils';

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    const settings = getSettings();
    if (settings.geminiApiKey) {
      setApiKey(settings.geminiApiKey);
    }
  }, []);

  const handleSaveSettings = () => {
    saveSettings({ geminiApiKey: apiKey.trim() });
    showToast('Paramètres sauvegardés.', 'success');
  };

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
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
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

  return (
    <>
      <h1 className="form-page-title">⚙️ Paramètres</h1>
      <div className="settings-container">
        
        <div className="settings-card">
          <div className="settings-title">🤖 Intelligence Artificielle</div>
          <div className="settings-row">
            <label className="settings-label" htmlFor="gemini-key">Clé API Gemini (optionnel)</label>
            <input 
              className="form-input" 
              type="password" 
              id="gemini-key" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="AIza..." 
              autoComplete="off" 
            />
            <span className="settings-hint">Permet à Gemini d'extraire les recettes TikTok. Clé gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.</span>
          </div>
          <button className="btn btn--primary btn--sm" onClick={handleSaveSettings}>💾 Sauvegarder</button>
        </div>

        <div className="settings-card">
          <div className="settings-title">🗄️ Données</div>
          
          <div className="settings-row">
            <span className="settings-label">Exporter toutes les recettes</span>
            <span className="settings-hint">Télécharge un fichier JSON avec toutes vos recettes.</span>
          </div>
          <button className="btn btn--secondary btn--sm" onClick={handleExport} style={{marginBottom: '16px'}}>
            ⬇️ Exporter (JSON)
          </button>
          
          <div className="settings-row">
            <span className="settings-label">Importer un fichier de recettes</span>
            <span className="settings-hint">Fusionne des recettes depuis un export JSON.</span>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
            <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" style={{display: 'none'}} />
            <button className="btn btn--secondary btn--sm" onClick={triggerImport}>⬆️ Importer (JSON)</button>
          </div>

          <hr className="form-divider" style={{margin: '20px 0'}} />

          <div className="settings-row">
            <span className="settings-label">Actualiser les recettes importées</span>
            <span className="settings-hint">Re-télécharge les images et informations manquantes de vos recettes importées via leur URL.</span>
          </div>
          <button className="btn btn--secondary btn--sm" onClick={async () => {
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
          }}>🔄 Actualiser les anciennes recettes</button>
          
          <hr className="form-divider" style={{margin: '20px 0'}} />
          
          <div className="settings-row">
            <span className="settings-label" style={{color: 'var(--danger)'}}>Zone dangereuse</span>
          </div>
          <button className="btn btn--danger btn--sm" onClick={handleResetData}>🗑️ Supprimer toutes les recettes</button>
        </div>

        <div className="settings-card">
          <div className="settings-title">ℹ️ À propos</div>
          <p style={{fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.7'}}>
            <strong>Carnet de Recettes</strong> — PWA Firebase<br/>
            Vos données sont synchronisées dans le cloud.
          </p>
        </div>
      </div>
    </>
  );
}
