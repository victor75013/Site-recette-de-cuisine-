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
    <article className="feed-card" onClick={onOpenRecipe}>
      {/* ─── EN-TÊTE DU POST ─── */}
      <div className="feed-header">
        <div className="feed-author-info">
          <img 
            src={authorPhoto} 
            alt="Avatar" 
            className="feed-avatar" 
          />
          <div className="feed-author-text">
            <span className="feed-author-name">{authorName}</span>
            <span className="feed-date">{dateStr}</span>
          </div>
        </div>
        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); /* Options menu */ }}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* ─── IMAGE (Format 4:5) ─── */}
      <div className="feed-image-container" onDoubleClick={handleLike}>
        {(!recipe.imageUrl || imgError) ? (
          <div className="feed-image-placeholder">
            <ImageOff size={48} color="var(--text-muted)" style={{ opacity: 0.5 }} />
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
        {/* Cœur géant flottant lors du double-tap */}
        {isLiking && liked && (
          <div className="feed-giant-heart">
            <Heart size={80} fill="white" color="white" />
          </div>
        )}
      </div>

      {/* ─── BARRE D'ACTIONS ─── */}
      <div className="feed-actions">
        <div className="feed-actions-left">
          <button className={`btn-action ${liked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={26} fill={liked ? '#ff3b30' : 'none'} color={liked ? '#ff3b30' : 'currentColor'} />
          </button>
          <button className="btn-action" onClick={onOpenRecipe}>
            <MessageCircle size={26} />
          </button>
          <button className="btn-action">
            <Share2 size={26} />
          </button>
        </div>
        <button className={`btn-action ${saved ? 'saved' : ''}`} onClick={handleSave}>
          <Bookmark size={26} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ─── DÉTAILS ET DESCRIPTION ─── */}
      <div className="feed-content">
        <div className="feed-likes">{likesCount} {likesCount > 1 ? 'J\'aime' : 'J\'aime'}</div>
        
        <div className="feed-caption">
          <span className="caption-author">{authorName}</span>
          <span className="caption-text">{recipe.title}</span>
        </div>
        
        {(recipe.commentsCount > 0) && (
          <div className="feed-comments-link">
            Voir les {recipe.commentsCount} commentaires
          </div>
        )}
      </div>
    </article>
  );
}
