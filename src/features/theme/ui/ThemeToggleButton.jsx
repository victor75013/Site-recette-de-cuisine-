import React from 'react';
import { Moon } from 'lucide-react';
import { useTheme } from '../model/useTheme';

export function ThemeToggleButton({ onClickWrapper }) {
  const { toggleTheme } = useTheme();

  const handleClick = (e) => {
    if (onClickWrapper) {
      onClickWrapper(e);
    }
    toggleTheme();
  };

  return (
    <button className="nav-item theme-btn" onClick={handleClick} title="Changer de thème">
      <Moon className="nav-icon" size={22} strokeWidth={2.5} />
      <span className="nav-text">Thème</span>
    </button>
  );
}
