import React, { useState, useEffect } from 'react';
import { getCustomSites, addCustomSite, deleteCustomSite } from '../core/data';
import { showToast } from '../core/utils';

const DEFAULT_SITES = [
  { id: 'marmiton',      name: 'Marmiton',       url: 'https://www.marmiton.org',             description: 'Le site de recettes de cuisine n°1 en France.',                   emoji: '👨‍🍳', tag: '🇫🇷 Français',      color: '#e8521a' },
  { id: '750g',          name: '750g',            url: 'https://www.750g.com',                 description: 'Des milliers de recettes faciles avec photos et vidéos.',           emoji: '🍽️', tag: '🇫🇷 Français',      color: '#f4a228' },
  { id: 'cuisineaz',     name: 'Cuisine AZ',      url: 'https://www.cuisineaz.com',            description: 'Recettes simples et rapides au quotidien.',                         emoji: '🥘', tag: '🇫🇷 Français',      color: '#2e7d32' },
  { id: 'ptitchef',      name: 'Ptitchef',        url: 'https://www.ptitchef.com',             description: 'Recettes de cuisine créatives par des amateurs passionnés.',        emoji: '🍳', tag: '🇫🇷 Français',      color: '#d32f2f' },
  { id: 'lesfoodies',    name: 'Les Foodies',     url: 'https://www.lesfoodies.com',           description: 'Recettes tendances et saisonnières.',                               emoji: '🌿', tag: '🇫🇷 Français',      color: '#558b2f' },
  { id: 'allrecipes',    name: 'AllRecipes',      url: 'https://www.allrecipes.com',           description: 'La plus grande communauté de recettes au monde.',                   emoji: '🌎', tag: '🌍 International',  color: '#e53935' },
  { id: 'bbcgoodfood',   name: 'BBC Good Food',   url: 'https://www.bbcgoodfood.com',          description: 'Recettes testées et approuvées par la BBC.',                        emoji: '🫖', tag: '🌍 International',  color: '#1565c0' },
  { id: 'seriouseats',   name: 'Serious Eats',    url: 'https://www.seriouseats.com',          description: 'Recettes scientifiques et techniques culinaires.',                  emoji: '🔬', tag: '🌍 International',  color: '#6a1b9a' },
  { id: 'simplyrecipes', name: 'Simply Recipes',  url: 'https://www.simplyrecipes.com',        description: 'Recettes maison simples et délicieuses.',                           emoji: '🏡', tag: '🌍 International',  color: '#00695c' },
  { id: 'ricardocuisine',name: 'Ricardo Cuisine', url: 'https://www.ricardocuisine.com/fr',   description: 'Recettes québécoises et inspirées du monde entier.',                emoji: '🍁', tag: '🌍 International',  color: '#c62828' },
  { id: 'tiktok-food',   name: 'TikTok Cuisine',  url: 'https://www.tiktok.com/tag/recette',  description: 'Vidéos de recettes tendances sur TikTok.',                          emoji: '🎵', tag: '📱 Vidéos',         color: '#010101' },
  { id: 'youtube-cooking',name:'YouTube Cuisine',  url: 'https://www.youtube.com/results?search_query=recette+cuisine', description: 'Chaînes de cuisine et tutoriels vidéo.', emoji: '▶️', tag: '📱 Vidéos',         color: '#c62828' },
  { id: 'instagram-food', name:'Instagram Food',   url: 'https://www.instagram.com/explore/tags/recette/', description: 'Inspiration culinaire et recettes sur Instagram.',   emoji: '📸', tag: '📱 Vidéos',         color: '#ad1457' },
];

export default function Sites() {
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

  const handleDelete = (e, id) => {
    e.stopPropagation();
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

  // Grouping sites by tag
  const groups = {};
  sites.forEach(site => {
    if (!groups[site.tag]) groups[site.tag] = [];
    groups[site.tag].push(site);
  });

  return (
    <>
      <div className="sites-header">
        <h1 className="page-title">Sites de <span>Recettes</span></h1>
        <button className="btn btn--primary btn--sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Fermer' : '+ Ajouter un site'}
        </button>
      </div>

      {showAddForm && (
        <div className="settings-card" style={{ marginTop: '24px' }}>
          <div className="settings-title">➕ Nouveau site favori</div>
          <div className="form-grid" style={{ marginTop: '12px' }}>
            <div className="form-group form-group--full">
              <label className="form-label">Nom du site *</label>
              <input className="form-input" type="text" placeholder="Ex : Cuisine du monde" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">URL *</label>
              <input className="form-input" type="url" placeholder="https://..." value={newSite.url} onChange={e => setNewSite({...newSite, url: e.target.value})} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Description courte</label>
              <input className="form-input" type="text" placeholder="Quelques mots sur ce site…" value={newSite.desc} onChange={e => setNewSite({...newSite, desc: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Icône (emoji)</label>
              <input className="form-input" type="text" placeholder="🍜" maxLength="4" style={{fontSize: '1.4rem'}} value={newSite.emoji} onChange={e => setNewSite({...newSite, emoji: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Couleur</label>
              <input type="color" style={{height: '42px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer', padding: '4px'}} value={newSite.color} onChange={e => setNewSite({...newSite, color: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button className="btn btn--primary btn--sm" onClick={handleSaveSite}>💾 Enregistrer</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setShowAddForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {Object.entries(groups).map(([tag, groupSites]) => (
        <div className="sites-group" key={tag}>
          <h2 className="sites-group-title">{tag}</h2>
          <div className="sites-grid">
            {groupSites.map(site => {
              let hostname = site.url;
              try { hostname = new URL(site.url).hostname; } catch {}
              let faviconUrl = '';
              try { faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`; } catch {}

              return (
                <div 
                  className="site-card" 
                  key={site.id} 
                  role="button" 
                  tabIndex="0" 
                  style={{ '--site-color': site.color }}
                  onClick={() => window.open(site.url, '_blank', 'noopener')}
                >
                  <div className="site-card-bar"></div>
                  {site.custom && (
                    <button className="site-card-delete" title="Supprimer" onClick={(e) => handleDelete(e, site.id)}>✕</button>
                  )}
                  <div className="site-card-body">
                    <div className="site-card-icon">
                      {faviconUrl ? (
                        <img src={faviconUrl} alt="" width="26" height="26" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='inline'; }} />
                      ) : null}
                      <span style={{ display: faviconUrl ? 'none' : 'inline', fontSize: '1.5rem' }}>{site.emoji || '🌐'}</span>
                    </div>
                    <div className="site-card-name">{site.name}</div>
                    <div className="site-card-desc">{site.description}</div>
                    <div className="site-card-url">{hostname}</div>
                  </div>
                  <div className="site-card-footer">
                    <span className="site-card-open">Ouvrir ↗</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
