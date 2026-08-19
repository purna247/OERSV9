import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

/**
 * Checkbox Component - Minimal Design
 *
 * A minimal checkbox with subtle accent color on check, label support,
 * and accessible keyboard interaction.
 *
 * Requirements: 13.6
 */
export const Checkbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  error,
  id,
  className,
  ...props
}) => {
  const checkId = id || (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={checkId}
        className={cn(
          'flex items-center gap-2.5 cursor-pointer select-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Custom checkbox box */}
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            id={checkId}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
            aria-invalid={!!error}
            aria-describedby={error ? `${checkId}-error` : undefined}
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded-sm border flex items-center justify-center',
              'transition-colors duration-normal',
              checked
                ? 'bg-text-primary border-text-primary'
                : 'bg-bg-primary border-border-default',
              !disabled && !checked && 'hover:border-text-secondary',
            )}
            aria-hidden="true"
          >
            {checked && (
              <Check className="w-2.5 h-2.5 text-bg-primary" strokeWidth={3} />
            )}
          </div>
        </div>

        {label && (
          <span className="text-sm text-text-primary">{label}</span>
        )}
      </label>

      {error && (
        <p
          id={`${checkId}-error`}
          className="text-xs text-accent-red animate-validation ml-6"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;
