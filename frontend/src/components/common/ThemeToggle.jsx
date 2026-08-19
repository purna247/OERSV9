import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * ThemeToggle Component
 * Minimal sun/moon icon button that toggles light/dark mode.
 * Requirements: 2.1, 7.2
 */
export const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-sm',
        'text-text-tertiary hover:text-text-primary hover:bg-bg-secondary',
        'transition-colors duration-normal',
        className
      )}
    >
      {theme === 'dark'
        ? <Sun  className="w-4 h-4" strokeWidth={1.5} />
        : <Moon className="w-4 h-4" strokeWidth={1.5} />}
    </button>
  );
};

export default ThemeToggle;
