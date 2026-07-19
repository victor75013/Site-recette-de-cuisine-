import React from 'react';
import { useSettings } from '../../../features/manage-settings/model/useSettings';
import { AiSettingsCard } from '../../../features/manage-settings/ui/AiSettingsCard';
import { DataManagementCard } from '../../../features/manage-data/ui/DataManagementCard';

export function SettingsPanel() {
  const { apiKey, setApiKey, handleSaveSettings } = useSettings();

  return (
    <>
      <h1 className="form-page-title">⚙️ Paramètres</h1>
      <div className="settings-container">
        <AiSettingsCard 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
          handleSaveSettings={handleSaveSettings} 
        />
        
        <DataManagementCard />

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
