import React from 'react';
import { cn } from '../../utils/cn';
import { getStatusColors } from '../../utils/formatters';

export const StatusChip = ({ status, className }) => {
  if (!status) return null;
  
  const colors = getStatusColors(status);
  
  return (
    <span 
      className={cn(
        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm inline-flex items-center justify-center border",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {status}
    </span>
  );
};
