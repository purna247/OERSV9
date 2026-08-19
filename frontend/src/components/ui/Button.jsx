import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Button Component - Minimal Antigravity Design
 *
 * Variants:
 *   primary   — solid dark (#121317 light / #e5e7eb dark)
 *   secondary — subtle gray background with border
 *   outline   — transparent with border
 *   ghost     — transparent, hover background only
 *
 * Sizes: sm (32px), md (40px), lg (48px)
 *
 * Requirements: 14.1–14.7
 */
export const Button = React.forwardRef(({
  variant  = 'primary',
  size     = 'md',
  isLoading = false,
  disabled,
  icon: Icon,
  children,
  className,
  ...props
}, ref) => {

  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-sm',
    'transition-opacity duration-normal',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

  const variants = {
    // Solid dark — Requirement 14.1
    primary:   'bg-text-primary text-bg-primary hover:opacity-90 active:opacity-85',
    // Subtle gray — Requirement 14.2
    secondary: 'bg-bg-secondary text-text-primary border border-border-default hover:opacity-90 active:opacity-85',
    // Transparent + border — Requirement 14.3
    outline:   'bg-transparent text-text-primary border border-border-default hover:bg-bg-secondary active:opacity-85',
    // Transparent, hover only — Requirement 14.4
    ghost:     'bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary active:opacity-85',
  };

  const sizes = {
    sm: 'h-8  px-3 text-xs',   // 32px
    md: 'h-10 px-4 text-sm',   // 40px
    lg: 'h-12 px-6 text-base', // 48px
  };

  return (
    <button
      ref={ref}
      disabled={isLoading || disabled}
      className={cn(base, variants[variant] ?? variants.primary, sizes[size], className)}
      {...props}
    >
      {isLoading
        ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        : Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
