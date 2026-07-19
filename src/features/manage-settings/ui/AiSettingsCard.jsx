import React from 'react';

export function AiSettingsCard({ apiKey, setApiKey, handleSaveSettings }) {
  return (
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
        <span className="settings-hint">
          Permet à Gemini d'extraire les recettes TikTok. Clé gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.
        </span>
      </div>
      <button className="btn btn--primary btn--sm" onClick={handleSaveSettings}>💾 Sauvegarder</button>
    </div>
  );
}
