import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Badge Component - Minimal Design
 *
 * Status badges with subtle, muted colors. Variants map to semantic meanings.
 * Replaces the old clay-morphism StatusChip with clean Antigravity styling.
 *
 * Requirements: 18.1, 18.2, 18.3
 *
 * @param {'default'|'success'|'warning'|'error'|'info'|'neutral'} [variant='default']
 * @param {'sm'|'md'} [size='md']
 */
export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-bg-secondary text-text-secondary border-border-default',
    success: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
    warning: 'bg-[#fef9c3] text-[#854d0e] border-[#fde68a]',
    error:   'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]',
    info:    'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]',
    neutral: 'bg-bg-secondary text-text-tertiary border-border-default',
  };

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-sm border',
        variantClasses[variant] ?? variantClasses.default,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
