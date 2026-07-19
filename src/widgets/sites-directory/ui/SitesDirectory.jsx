import React from 'react';
import { useManageSites } from '../../../features/manage-sites/model/useManageSites';
import { AddSiteForm } from '../../../features/manage-sites/ui/AddSiteForm';
import { SiteCard } from '../../../entities/site/ui/SiteCard';

export function SitesDirectory() {
  const {
    sites,
    showAddForm,
    setShowAddForm,
    newSite,
    setNewSite,
    handleDelete,
    handleSaveSite
  } = useManageSites();

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
        <AddSiteForm 
          newSite={newSite} 
          setNewSite={setNewSite} 
          handleSaveSite={handleSaveSite} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}

      {Object.entries(groups).map(([tag, groupSites]) => (
        <div className="sites-group" key={tag}>
          <h2 className="sites-group-title">{tag}</h2>
          <div className="sites-grid">
            {groupSites.map(site => (
              <SiteCard 
                key={site.id} 
                site={site} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
