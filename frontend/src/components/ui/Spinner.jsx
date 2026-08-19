import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Spinner Component - Minimal Design
 *
 * A minimal loading spinner using a CSS border animation.
 * Respects prefers-reduced-motion via the global CSS rule in animations.css.
 *
 * Requirements: 18.1
 *
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {string} [className]
 */
export const Spinner = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  };

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full',
        'border-border-default border-t-text-primary',
        'animate-spin',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

export default Spinner;
