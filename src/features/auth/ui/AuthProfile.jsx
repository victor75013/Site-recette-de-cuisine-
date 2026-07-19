import React from 'react';
import { LogIn, LogOut } from 'lucide-react';

export function AuthProfile({ user, onLogin, onLogout }) {
  if (!user) {
    return (
      <button className="btn btn--sm btn--auth" onClick={onLogin}>
        <LogIn className="auth-icon" size={22} strokeWidth={2.5} />
        <span className="auth-text">Connexion</span>
      </button>
    );
  }

  return (
    <div className="auth-user">
      <img src={user.photoURL || ''} alt="Avatar" className="auth-avatar" />
      <button className="btn btn--sm btn--danger btn--auth" onClick={onLogout}>
        <LogOut className="auth-icon" size={22} strokeWidth={2.5} />
        <span className="auth-text">Quitter</span>
      </button>
    </div>
  );
}
