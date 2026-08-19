import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

/**
 * Select Component - Minimal Design
 *
 * A clean dropdown select with minimal styling, label, and error state.
 *
 * Requirements: 13.6
 */
export const Select = ({
  label,
  error,
  disabled = false,
  className,
  id,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          className={cn(
            // Base
            'w-full h-10 pl-3 pr-9 text-sm appearance-none',
            'bg-bg-primary text-text-primary',
            'border rounded-sm',
            'transition-colors duration-normal',
            'focus:outline-none',
            // Border states
            error
              ? 'border-accent-red focus:border-accent-red'
              : 'border-border-default focus:border-text-secondary',
            // Disabled
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {children}
        </select>

        {/* Chevron icon */}
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p
          id={`${selectId}-error`}
          className="text-xs text-accent-red animate-validation"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
