import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, label, error, helperText, id, ...props }, ref) => {
  const inputId = id || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-black text-text-dark font-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-soft-purple/20 focus:border-soft-purple transition-all shadow-sm",
          error && "border-coral focus:border-coral focus:ring-coral/20",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-bold text-coral">{error}</p>}
      {!error && helperText && <p className="text-xs font-medium text-text-muted">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
