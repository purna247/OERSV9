import { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      // Use saved preference
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to light mode (no system preference detection)
      setThemeState('light');
      applyTheme('light');
    }
    
    setIsLoading(false);
  }, []);

  // Listen for system theme changes (disabled - always default to light)
  // useEffect(() => {
  //   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  //   
  //   const handleChange = (e) => {
  //     // Only update if user hasn't set a preference
  //     const savedTheme = localStorage.getItem('theme');
  //     if (!savedTheme) {
  //       const newTheme = e.matches ? 'dark' : 'light';
  //       setThemeState(newTheme);
  //       applyTheme(newTheme);
  //     }
  //   };
  //   
  //   mediaQuery.addEventListener('change', handleChange);
  //   
  //   return () => mediaQuery.removeEventListener('change', handleChange);
  // }, []);

  // Apply theme to document root
  const applyTheme = (newTheme) => {
    // Use requestAnimationFrame to ensure changes apply within 100ms
    requestAnimationFrame(() => {
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Also update class for Tailwind dark mode support
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  };

  // Set theme and persist to localStorage
  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.warn(`Invalid theme: ${newTheme}. Must be 'light' or 'dark'.`);
      return;
    }
    
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
