import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { toggleLike, hasUserLiked, saveRecipeToBook, currentUser } from '../../core/data';
import './Feed.css';

export default function FeedCard({ recipe, onOpenRecipe }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(recipe.likesCount || 0);
  const [saved, setSaved] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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

  return (
    <article className="feed-card" onClick={onOpenRecipe}>
      {/* ─── EN-TÊTE DU POST ─── */}
      <div className="feed-header">
        <div className="feed-author-info">
          <img 
            src={recipe.author?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (recipe.author?.name || 'Chef')} 
            alt="Avatar" 
            className="feed-avatar" 
          />
          <div className="feed-author-text">
            <span className="feed-author-name">{recipe.author?.name || 'Chef Mystère'}</span>
            <span className="feed-date">{dateStr}</span>
          </div>
        </div>
        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); /* Options menu */ }}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* ─── IMAGE (Format 4:5) ─── */}
      <div className="feed-image-container" onDoubleClick={handleLike}>
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="feed-image" loading="lazy" />
        ) : (
          <div className="feed-image-placeholder">
            <span className="placeholder-emoji">🍲</span>
          </div>
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
          <span className="caption-author">{recipe.author?.name || 'Chef Mystère'}</span>
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
