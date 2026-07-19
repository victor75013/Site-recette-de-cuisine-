import { useState, useEffect } from 'react';
import { getCustomSites, addCustomSite, deleteCustomSite } from '../../../shared/api/data';
import { showToast } from '../../../shared/lib/utils';
import { DEFAULT_SITES } from '../../../entities/site/model/constants';

export function useManageSites() {
  const [sites, setSites] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newSite, setNewSite] = useState({
    name: '', url: '', desc: '', emoji: '', color: '#e8521a'
  });

  const loadSites = () => {
    const custom = getCustomSites();
    setSites([...DEFAULT_SITES, ...custom]);
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleDelete = (id) => {
    deleteCustomSite(id);
    loadSites();
  };

  const handleSaveSite = () => {
    const { name, url, desc, emoji, color } = newSite;
    if (!name.trim()) { showToast('Le nom est obligatoire.', 'error'); return; }
    if (!url.trim() || !url.startsWith('http')) { showToast('URL invalide.', 'error'); return; }

    addCustomSite({
      id: `custom_${Date.now()}`,
      name: name.trim(),
      url: url.trim(),
      description: desc.trim(),
      emoji: emoji.trim() || '🌐',
      tag: '⭐ Mes favoris',
      color,
      custom: true
    });
    
    showToast(`"${name}" ajouté !`, 'success');
    setShowAddForm(false);
    setNewSite({ name: '', url: '', desc: '', emoji: '', color: '#e8521a' });
    loadSites();
  };

  return {
    sites,
    showAddForm,
    setShowAddForm,
    newSite,
    setNewSite,
    handleDelete,
    handleSaveSite
  };
}
