import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Skeleton Component - Minimal Design
 *
 * A skeleton loader with a gentle pulse animation for loading states.
 * Uses design tokens for colors and the animate-skeleton-pulse animation
 * defined in animations.css.
 *
 * Requirements: 18.2
 *
 * @param {string} [className] - Pass width/height/rounded classes here
 */
export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      'animate-skeleton-pulse',
      'bg-border-default',   // uses rgba(33,34,38,0.1) — subtle in both themes
      'rounded-sm',
      className
    )}
    aria-hidden="true"
    {...props}
  />
);

export default Skeleton;
