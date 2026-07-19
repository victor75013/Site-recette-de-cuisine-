import React from 'react';
import { useDataManagement } from '../model/useDataManagement';

export function DataManagementCard() {
  const {
    fileInputRef,
    handleExport,
    triggerImport,
    handleImportFile,
    handleUpdateImported,
    handleResetData
  } = useDataManagement();

  return (
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
      <button className="btn btn--secondary btn--sm" onClick={handleUpdateImported}>🔄 Actualiser les anciennes recettes</button>
      
      <hr className="form-divider" style={{margin: '20px 0'}} />
      
      <div className="settings-row">
        <span className="settings-label" style={{color: 'var(--danger)'}}>Zone dangereuse</span>
      </div>
      <button className="btn btn--danger btn--sm" onClick={handleResetData}>🗑️ Supprimer toutes les recettes</button>
    </div>
  );
}
