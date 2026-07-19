import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../../../shared/api/data';
import { showToast } from '../../../shared/lib/utils';

export function useSettings() {
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

  return {
    apiKey,
    setApiKey,
    handleSaveSettings
  };
}
