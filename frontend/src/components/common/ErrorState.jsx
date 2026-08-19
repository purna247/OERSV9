import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({ title = "Something went wrong", message, onRetry }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center clay-card border-coral/20">
      <div className="w-16 h-16 bg-coral/10 rounded-2xl flex items-center justify-center text-coral mb-6 shadow-inner">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-black font-headline text-text-dark mb-2">{title}</h3>
      <p className="text-sm font-medium text-text-muted max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="white" className="border border-gray-200">
          Try Again
        </Button>
      )}
    </div>
  );
};
