import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({ 
  className, 
  variant = 'purple', 
  size = 'md', 
  isLoading = false, 
  disabled, 
  children, 
  icon: Icon,
  ...props 
}, ref) => {
  
  const baseStyles = "inline-flex items-center justify-center font-black transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed";
  
  const variants = {
    purple: "clay-button-purple",
    mint: "clay-button-mint",
    coral: "clay-button-coral",
    white: "clay-button-white",
    ghost: "bg-transparent hover:bg-gray-100 text-text-dark border-transparent shadow-none active:transform-none"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-8 py-4 text-base rounded-2xl"
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && Icon && <Icon className="mr-2 h-5 w-5" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
