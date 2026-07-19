import React from 'react';

export function ImportForm({ importer }) {
  const {
    url,
    setUrl,
    status,
    preview,
    handleImport,
    handleSaveDirectly,
    handleEditBeforeSave
  } = importer;

  return (
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
  );
}
