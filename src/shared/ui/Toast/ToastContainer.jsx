import React, { useState, useEffect } from 'react';

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const newToast = { id: Date.now(), ...e.detail };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration || 3500);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span>{icons[t.type] || ''}</span> {t.message}
        </div>
      ))}
    </div>
  );
}
