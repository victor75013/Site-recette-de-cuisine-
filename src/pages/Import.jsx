import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveRecipe, currentUser, getSettings } from '../core/data';
import { showToast } from '../core/utils';

const LOCAL_SERVER = 'http://localhost:3001';

export default function Import() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [preview, setPreview] = useState(null);

  const checkLocalServer = async () => {
    try {
      const res = await fetch(`${LOCAL_SERVER}/ping`, { signal: AbortSignal.timeout(1500) });
      const json = await res.json();
      return json.ok === true;
    } catch {
      return false;
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setPreview(null);
    setStatus({ type: 'loading', message: '⏳ Vérification du serveur local...' });

    try {
      const hasLocalServer = await checkLocalServer();

      if (hasLocalServer) {
        setStatus({ type: 'loading', message: '⏳ Importation via le serveur local...' });
        const res = await fetch(`${LOCAL_SERVER}/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        });
        
        if (!res.ok) throw new Error("Le serveur a refusé l'importation.");
        
        const data = await res.json();
        
        // Formater les données extraites
        const recipe = {
          title: data.title || 'Recette Importée',
          description: data.description || '',
          imageUrl: data.image || '',
          sourceUrl: data.url || url.trim(),
          category: 'Autres',
          prepTime: data.prepTime || 0,
          cookTime: data.cookTime || 0,
          servings: data.servings || 0,
          ingredients: data.ingredients || [],
          steps: data.instructions || []
        };
        
        setStatus({ type: 'success', message: '✅ Importation réussie !' });
        setPreview(recipe);

      } else {
        // Fallback or specific TikTok parsing (simplified for React porting)
        setStatus({ type: 'error', message: '❌ Le serveur d\'importation (localhost:3001) n\'est pas lancé.' });
      }

    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: `❌ Erreur: ${err.message}` });
    }
  };

  const handleSaveDirectly = async () => {
    if (!currentUser) {
      showToast("Vous devez être connecté", "error");
      return;
    }
    try {
      await saveRecipe(preview);
      showToast(`"${preview.title}" ajoutée !`, 'success');
      navigate('/');
    } catch (err) {
      showToast('Erreur: ' + err.message, 'error');
    }
  };

  const handleEditBeforeSave = () => {
    // Navigate to AddEdit and pass state
    navigate('/add', { state: { prefill: preview } });
  };

  return (
    <>
      <h1 className="form-page-title">🔗 Importer une recette</h1>
      <div className="import-container">
        <p className="import-description">
          Copiez-collez l'URL d'une recette depuis un site web ou TikTok pour l'importer automatiquement dans votre carnet.
        </p>

        <form id="import-form" onSubmit={handleImport}>
          <div className="search-bar">
            <input 
              type="url" 
              className="search-input" 
              id="import-url" 
              placeholder="https://www.marmiton.org/..." 
              required 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit" className="search-btn">Importer</button>
          </div>
        </form>

        {status.message && (
          <div className={`import-status ${status.type}`}>
            {status.type === 'loading' && <span className="spinner"></span>}
            {status.message}
          </div>
        )}

        {preview && (
          <div className="import-preview" id="import-preview">
            <div className="import-preview-title">📋 Aperçu de la recette importée</div>
            {preview.imageUrl && (
              <img src={preview.imageUrl} alt="" style={{width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px'}} />
            )}
            <h3 style={{fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px'}}>{preview.title}</h3>
            {preview.description && <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px'}}>{preview.description}</p>}
            
            {preview.ingredients.length > 0 ? (
              <>
                <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600'}}>INGRÉDIENTS ({preview.ingredients.length})</p>
                <ul style={{listStyle: 'disc', paddingLeft: '20px', fontSize: '0.85rem', marginBottom: '12px'}}>
                  {preview.ingredients.slice(0, 8).map((i, idx) => <li key={idx}>{i}</li>)}
                  {preview.ingredients.length > 8 && <li style={{color: 'var(--text-muted)'}}>…et {preview.ingredients.length - 8} autres</li>}
                </ul>
              </>
            ) : (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Aucun ingrédient extrait — à compléter manuellement.</p>
            )}

            {preview.steps.length > 0 ? (
              <p style={{fontSize: '0.82rem', color: 'var(--text-muted)'}}>{preview.steps.length} étape(s) extraite(s)</p>
            ) : (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Aucune étape extraite — à compléter manuellement.</p>
            )}

            <div style={{display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap'}}>
              <button className="btn btn--primary" onClick={handleSaveDirectly}>💾 Sauvegarder directement</button>
              <button className="btn btn--secondary" onClick={handleEditBeforeSave}>✏️ Modifier avant de sauvegarder</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
