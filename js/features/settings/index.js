import { showToast, escapeHtml, generateId } from '../../core/utils.js';
import { getSettings, saveSettings, getAllRecipes, deleteRecipe, saveRecipe, currentUser } from '../../core/data.js';
import { navigateTo } from '../navigation/index.js';

export function renderSettingsPage() {
  const app = document.getElementById('app');
  const settings = getSettings();
  app.innerHTML = `
    <h1 class="form-page-title">⚙️ Paramètres</h1>
    <div class="settings-container">
      <div class="settings-card">
        <div class="settings-title">🤖 Intelligence Artificielle</div>
        <div class="settings-row">
          <label class="settings-label" for="gemini-key">Clé API Gemini (optionnel)</label>
          <input class="form-input" type="password" id="gemini-key" value="${escapeHtml(settings.geminiApiKey || '')}" placeholder="AIza..." autocomplete="off" />
          <span class="settings-hint">Permet à Gemini d'extraire les recettes TikTok. Clé gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>.</span>
        </div>
        <button class="btn btn--primary btn--sm" id="btn-save-settings">💾 Sauvegarder</button>
      </div>
      <div class="settings-card">
        <div class="settings-title">🗄️ Données</div>
        <div class="settings-row">
          <span class="settings-label">Exporter toutes les recettes</span>
          <span class="settings-hint">Télécharge un fichier JSON avec toutes vos recettes.</span>
        </div>
        <button class="btn btn--secondary btn--sm" id="btn-export" style="margin-bottom:16px;">⬇️ Exporter (JSON)</button>
        <div class="settings-row">
          <span class="settings-label">Importer un fichier de recettes</span>
          <span class="settings-hint">Fusionne des recettes depuis un export JSON.</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <input type="file" id="import-file-input" accept=".json" style="display:none" />
          <button class="btn btn--secondary btn--sm" id="btn-import-file">⬆️ Importer (JSON)</button>
        </div>
        <hr class="form-divider" style="margin:20px 0;" />
        <div class="settings-row"><span class="settings-label" style="color:var(--danger);">Zone dangereuse</span></div>
        <button class="btn btn--danger btn--sm" id="btn-reset-data">🗑️ Supprimer toutes les recettes</button>
      </div>
      <div class="settings-card">
        <div class="settings-title">ℹ️ À propos</div>
        <p style="font-size:0.88rem;color:var(--text-muted);line-height:1.7;"><strong>Carnet de Recettes</strong> — Stockage local (localStorage).<br/>Vos recettes sont sauvegardées sur cet appareil.</p>
      </div>
    </div>
  `;

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const key = document.getElementById('gemini-key').value.trim();
    saveSettings({ geminiApiKey: key });
    showToast('Paramètres sauvegardés.', 'success');
  });

  document.getElementById('btn-export').addEventListener('click', async () => {
    const recipes = await getAllRecipes();
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `recettes_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast('Export téléchargé !', 'success');
  });

  document.getElementById('btn-import-file').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });

  document.getElementById('import-file-input').addEventListener('change', (e) => {
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
        navigateTo('home');
      } catch (err) { showToast('Erreur import : ' + err.message, 'error'); }
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-reset-data').addEventListener('click', async () => {
    if (confirm('Voulez-vous vraiment supprimer toutes VOS recettes du cloud ? Cette action est irréversible.')) {
      if (!currentUser) return showToast('Vous devez être connecté.', 'error');
      try {
        const recipes = await getAllRecipes();
        const myRecipes = recipes.filter(r => r.createdBy === currentUser.uid);
        for (const r of myRecipes) {
          await deleteRecipe(r.id);
        }
        showToast('Vos recettes ont été supprimées.', 'info');
        navigateTo('home');
      } catch(err) {
        showToast('Erreur: ' + err.message, 'error');
      }
    }
  });
}
