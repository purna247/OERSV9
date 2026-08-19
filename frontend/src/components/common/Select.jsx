import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(({ className, label, error, options = [], id, ...props }, ref) => {
  const selectId = id || Math.random().toString(36).substring(7);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-black text-text-dark font-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={cn(
          "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-text-dark focus:outline-none focus:ring-2 focus:ring-soft-purple/20 focus:border-soft-purple transition-all shadow-sm appearance-none",
          error && "border-coral focus:border-coral focus:ring-coral/20",
          className
        )}
        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-bold text-coral">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
