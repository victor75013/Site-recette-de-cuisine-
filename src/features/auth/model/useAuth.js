import { useState, useEffect } from 'react';
import { onAuthChange, loginWithGoogle, logout } from '../../../shared/api/data';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => setUser(user));
    return () => unsubscribe();
  }, []);

  return {
    user,
    login: loginWithGoogle,
    logout
  };
}
