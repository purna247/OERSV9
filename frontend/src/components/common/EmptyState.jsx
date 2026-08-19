import React from 'react';
import { FileX2 } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({ title, description, actionText, onAction, icon: Icon = FileX2 }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center clay-card">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-6 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-black font-headline text-text-dark mb-2">{title}</h3>
      <p className="text-sm font-medium text-text-muted max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="purple">
          {actionText}
        </Button>
      )}
    </div>
  );
};
