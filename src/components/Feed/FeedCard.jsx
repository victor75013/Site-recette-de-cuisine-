import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, ImageOff } from 'lucide-react';
import { toggleLike, hasUserLiked, saveRecipeToBook, currentUser } from '../../core/data';
import './Feed.css';

export default function FeedCard({ recipe, onOpenRecipe }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(recipe.likesCount || 0);
  const [saved, setSaved] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (currentUser) {
      hasUserLiked(recipe.id).then(setLiked);
      // Pour saved, on pourrait ajouter un hasUserSaved(recipe.id) plus tard
    }
  }, [recipe.id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) return alert("Vous devez être connecté pour aimer une recette.");
    
    // Optimistic UI update
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    setIsLiking(true);
    setTimeout(() => setIsLiking(false), 500); // Pour l'animation
    
    try {
      await toggleLike(recipe.id);
    } catch (error) {
      // Revert in case of failure
      setLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
      console.error(error);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!currentUser) return alert("Vous devez être connecté pour sauvegarder.");
    setSaved(!saved);
    try {
      await saveRecipeToBook(recipe.id);
    } catch (error) {
      setSaved(saved);
      console.error(error);
    }
  };

  // Formater la date
  const dateStr = recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' }) : '';

  // Gestion de la rétrocompatibilité (anciennes recettes avec `author` en tant que chaîne de caractères)
  const authorName = typeof recipe.author === 'string' 
    ? recipe.author 
    : (recipe.author?.name || 'Chef Mystère');

  const authorPhoto = typeof recipe.author === 'object' && recipe.author?.photoURL 
    ? recipe.author.photoURL 
    : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

  return (
    <article className="feed-card netflix-style" onClick={onOpenRecipe}>
      <div className="feed-image-container" onDoubleClick={handleLike}>
        {(!recipe.imageUrl || imgError) ? (
          <div className="feed-image-placeholder">
            <ImageOff size={48} color="rgba(255, 255, 255, 0.4)" />
          </div>
        ) : (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="feed-image" 
            loading="lazy" 
            onError={() => setImgError(true)} 
          />
        )}
        
        {/* Dégradé pour lisibilité du texte (Netflix UI) */}
        <div className="feed-overlay-gradient"></div>

        {/* Contenu textuel superposé */}
        <div className="feed-overlay-content">
          <h2 className="feed-netflix-title">{recipe.title}</h2>
          
          <div className="feed-netflix-meta">
            <img src={authorPhoto} alt="Avatar" className="feed-netflix-avatar" />
            <div className="feed-netflix-author-info">
              <span className="feed-netflix-author">{authorName}</span>
              <span className="feed-netflix-date">{dateStr}</span>
            </div>
            {/* Options */}
            <button className="btn-icon netflix-more" onClick={(e) => { e.stopPropagation(); }}>
              <MoreHorizontal size={20} color="rgba(255,255,255,0.7)" />
            </button>
          </div>
          
          <div className="feed-netflix-actions">
            <div className="feed-actions-left">
              <button className={`btn-action netflix-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                <Heart size={26} fill={liked ? '#ff3b30' : 'none'} color={liked ? '#ff3b30' : 'white'} />
                {likesCount > 0 && <span className="action-count">{likesCount}</span>}
              </button>
              <button className="btn-action netflix-btn" onClick={onOpenRecipe}>
                <MessageCircle size={26} color="white" />
                {recipe.commentsCount > 0 && <span className="action-count">{recipe.commentsCount}</span>}
              </button>
              <button className="btn-action netflix-btn">
                <Share2 size={26} color="white" />
              </button>
            </div>
            <button className={`btn-action netflix-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
              <Bookmark size={26} fill={saved ? 'white' : 'none'} color="white" />
            </button>
          </div>
        </div>

        {/* Cœur géant flottant lors du double-tap */}
        {isLiking && liked && (
          <div className="feed-giant-heart">
            <Heart size={80} fill="white" color="white" />
          </div>
        )}
      </div>
    </article>
  );
}
