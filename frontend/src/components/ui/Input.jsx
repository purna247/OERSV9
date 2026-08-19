import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Input Component - Minimal Antigravity Design
 *
 * - Border radius: 4px (rounded-sm)
 * - Border: 1px solid with 0.2 opacity (border-border-input)
 * - Focus: border opacity 0.5, transition 150ms
 * - Height: 40px (h-10)
 * - Padding: 12px 16px
 * - Font size: 14px
 * - Label: 14px, weight 500, 8px margin-bottom
 * - Error: muted red (#EF4444) with fade-in message
 * - Success: muted green (#10B981)
 *
 * Requirements: 13.1–13.7
 */
export const Input = React.forwardRef(({
  type        = 'text',
  label,
  error,
  success     = false,
  placeholder,
  disabled    = false,
  id,
  className,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const borderClass = error
    ? 'border-accent-red focus:border-accent-red'
    : success
      ? 'border-accent-green focus:border-accent-green'
      : 'border-border-input focus:border-border-focus';

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          // Base — Requirement 13.1, 13.2
          'w-full h-10 px-4 text-sm',
          'bg-bg-primary text-text-primary',
          'border rounded-sm',
          'placeholder:text-text-tertiary',
          // Focus transition — Requirement 13.3
          'transition-colors duration-normal',
          'focus:outline-none',
          // Border state
          borderClass,
          // Disabled
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      />

      {/* Error message — Requirement 13.5 */}
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-accent-red animate-validation"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
