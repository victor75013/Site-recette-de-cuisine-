import React from 'react';

export function SiteCard({ site, onDelete }) {
  let hostname = site.url;
  try { hostname = new URL(site.url).hostname; } catch {}
  let faviconUrl = '';
  try { faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`; } catch {}

  return (
    <div 
      className="site-card" 
      role="button" 
      tabIndex="0" 
      style={{ '--site-color': site.color }}
      onClick={() => window.open(site.url, '_blank', 'noopener')}
    >
      <div className="site-card-bar"></div>
      {site.custom && onDelete && (
        <button 
          className="site-card-delete" 
          title="Supprimer" 
          onClick={(e) => { e.stopPropagation(); onDelete(site.id); }}
        >✕</button>
      )}
      <div className="site-card-body">
        <div className="site-card-icon">
          {faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt="" 
              width="26" 
              height="26" 
              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='inline'; }} 
            />
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
}
