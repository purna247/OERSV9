import React from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * PageTransition Component
 *
 * Wraps page content with a subtle fade-in animation on every route change.
 * Uses the location pathname as a key so React remounts the wrapper on
 * navigation, re-triggering the CSS animation.
 *
 * Animation: 250ms fade-in (opacity 0 → 1), defined in animations.css
 * Accessibility: animation is skipped when prefers-reduced-motion is set.
 *
 * Requirements: 3.4
 */
export const PageTransition = ({ children }) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      key={location.pathname}
      className={prefersReducedMotion ? '' : 'page-enter'}
      style={{ width: '100%' }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
