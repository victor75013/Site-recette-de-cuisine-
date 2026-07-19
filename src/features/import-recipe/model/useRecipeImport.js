import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveRecipe, currentUser } from '../../../shared/api/data';
import { showToast } from '../../../shared/lib/utils';

const LOCAL_SERVER = 'http://localhost:3001';

export function useRecipeImport() {
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
    navigate('/add', { state: { prefill: preview } });
  };

  return {
    url,
    setUrl,
    status,
    preview,
    handleImport,
    handleSaveDirectly,
    handleEditBeforeSave
  };
}
