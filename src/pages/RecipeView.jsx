import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRecipeById } from '../shared/api/data';
import useDominantColor from '../hooks/useDominantColor';
import { ArrowLeft, Clock, Users, ChefHat, CheckCircle2 } from 'lucide-react';
import '../styles/features/recipes/view.css';

export default function RecipeView({ asModal }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // On tente d'abord de récupérer la recette depuis le state du Router (instantané)
  const [recipe, setRecipe] = useState(location.state?.recipe || null);
  const [loading, setLoading] = useState(!recipe);

  useEffect(() => {
    // Si pas de recette dans le state (ex: refresh direct de l'URL), on la charge
    if (!recipe) {
      getRecipeById(id).then(data => {
        setRecipe(data);
        setLoading(false);
      });
    }
  }, [id, recipe]);

  if (loading) {
    return <div className="empty-state"><h3>Chargement de la recette...</h3></div>;
  }

  if (!recipe) {
    return <div className="empty-state"><h3>Recette introuvable 😕</h3><button className="btn btn--primary" onClick={() => navigate('/')}>Retour à l'accueil</button></div>;
  }

  // Rétrocompatibilité auteur
  const authorName = typeof recipe.author === 'string' ? recipe.author : (recipe.author?.name || 'Chef Mystère');
  const authorPhoto = typeof recipe.author === 'object' && recipe.author?.photoURL 
    ? recipe.author.photoURL 
    : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

  // Image de secours
  const displayImage = recipe.imageUrl || 'https://images.unsplash.com/photo-1495195134817-a1a18bc081ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
  
  // Magie : on extrait la couleur dominante de l'image
  const colorData = useDominantColor(displayImage);

  const totalTime = (parseInt(recipe.prepTime) || 0) + (parseInt(recipe.cookTime) || 0);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <motion.div 
      className={`recipe-view-container ${asModal ? 'recipe-view-modal' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
      transition={{ duration: 0.4 }}
      style={{
        '--dominant-bg': colorData.bg,
        '--dominant-text': colorData.text,
      }}
    >
      {/* BOUTON RETOUR */}
      <button className="btn-back-absolute" onClick={handleBack} aria-label="Retour">
        <ArrowLeft size={24} />
      </button>

      <motion.div 
        className="recipe-split-layout"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* COLONNE GAUCHE (Titre, Méta, Étapes) */}
        <div className="recipe-left-col">
          <div className="recipe-header-info">
            <h1 className="recipe-view-title">{recipe.title}</h1>
            <div className="recipe-view-meta">
              <div className="recipe-view-meta-item">
                <img src={authorPhoto} alt="Avatar" className="recipe-view-author-img" />
                <span>{authorName}</span>
              </div>
              {totalTime > 0 && (
                <div className="recipe-view-meta-item">
                  <Clock size={20} />
                  <span>{totalTime} min</span>
                </div>
              )}
              {recipe.servings > 0 && (
                <div className="recipe-view-meta-item">
                  <Users size={20} />
                  <span>{recipe.servings} {recipe.servingsUnit || 'personnes'}</span>
                </div>
              )}
            </div>
            
            {recipe.description && (
              <p className="recipe-description">
                {recipe.description}
              </p>
            )}
          </div>

          <section className="recipe-steps-section">
            <h2 className="recipe-section-title">Préparation</h2>
            {recipe.steps && recipe.steps.length > 0 ? (
              <div className="steps-list">
                {recipe.steps.map((step, i) => (
                  <div key={i} className="step-card">
                    <div className="step-number">{i + 1}</div>
                    <div className="step-content">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{color: 'var(--text-muted)'}}>Aucune étape renseignée.</p>
            )}
          </section>
        </div>

        {/* COLONNE DROITE (Sticky: Image + Ingrédients) */}
        <aside className="recipe-right-col">
          <div className="recipe-sticky-wrapper">
            <div className="recipe-image-wrapper">
              <img src={displayImage} alt={recipe.title} />
            </div>

            <div className="recipe-ingredients-card">
              <h2 className="recipe-section-title"><ChefHat size={28} color="var(--primary)" /> Ingrédients</h2>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <ul className="ingredients-list">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="ingredient-item">
                      <CheckCircle2 size={20} className="ingredient-bullet" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{color: 'var(--text-muted)'}}>Aucun ingrédient renseigné.</p>
              )}
            </div>
          </div>
        </aside>

      </motion.div>
    </motion.div>
  );
}
