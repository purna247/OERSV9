import React from 'react';
import { cn } from '../../utils/cn';

export const StatCard = ({ title, value, icon: Icon, trend, colorType = 'mint', highlight = false }) => {
  
  const colors = {
    mint: { bg: 'bg-mint/10', text: 'text-mint', border: 'border-mint/30' },
    purple: { bg: 'bg-soft-purple/10', text: 'text-soft-purple', border: 'border-soft-purple/30' },
    coral: { bg: 'bg-coral/10', text: 'text-coral', border: 'border-coral/30' },
  };
  
  const theme = colors[colorType] || colors.mint;

  return (
    <div className={cn(
      "clay-card p-6 flex flex-col justify-between h-44",
      highlight && `border-b-4 ${theme.border}`
    )}>
      <div className="flex justify-between items-start">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", theme.bg, theme.text)}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend && (
          <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm text-white", colorType === 'mint' ? 'bg-mint' : colorType === 'coral' ? 'bg-coral' : 'bg-soft-purple')}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-black font-headline text-text-dark">{value}</p>
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-wider mt-1",
          highlight ? `${theme.text} opacity-80` : "text-text-muted"
        )}>
          {title}
        </p>
      </div>
    </div>
  );
};
