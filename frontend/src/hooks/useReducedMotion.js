import { useState, useEffect } from 'react';

/**
 * Custom hook to detect user's motion preference for accessibility
 * 
 * Detects the prefers-reduced-motion media query and returns a boolean
 * indicating whether animations should be disabled.
 * 
 * @returns {boolean} True if user prefers reduced motion, false otherwise
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * // Use in component
 * <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
 *   Content
 * </div>
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Create media query for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Handler for media query changes
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Listen for changes to the media query
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};
