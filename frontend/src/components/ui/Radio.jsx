import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Radio Component - Minimal Design
 *
 * A minimal radio button with label support and accessible interaction.
 * Use RadioGroup to manage a set of Radio buttons together.
 *
 * Requirements: 13.6
 */
export const Radio = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  value,
  name,
  id,
  className,
  ...props
}) => {
  const radioId = id || (label ? `radio-${name}-${value}` : undefined);

  return (
    <label
      htmlFor={radioId}
      className={cn(
        'flex items-center gap-2.5 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative flex-shrink-0">
        <input
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        {/* Outer ring */}
        <div
          className={cn(
            'w-4 h-4 rounded-full border flex items-center justify-center',
            'transition-colors duration-normal',
            checked
              ? 'border-text-primary'
              : 'border-border-default',
            !disabled && !checked && 'hover:border-text-secondary',
          )}
          aria-hidden="true"
        >
          {/* Inner dot */}
          {checked && (
            <div className="w-2 h-2 rounded-full bg-text-primary" />
          )}
        </div>
      </div>

      {label && (
        <span className="text-sm text-text-primary">{label}</span>
      )}
    </label>
  );
};

/**
 * RadioGroup - wraps a set of Radio buttons with a shared label and error state.
 */
export const RadioGroup = ({ label, error, children, className }) => (
  <fieldset className={cn('flex flex-col gap-2', className)}>
    {label && (
      <legend className="text-sm font-medium text-text-secondary mb-1">
        {label}
      </legend>
    )}
    {children}
    {error && (
      <p className="text-xs text-accent-red animate-validation" role="alert">
        {error}
      </p>
    )}
  </fieldset>
);

export default Radio;
