import React from 'react';

export function AddSiteForm({ newSite, setNewSite, handleSaveSite, onCancel }) {
  return (
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
        <button className="btn btn--secondary btn--sm" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
