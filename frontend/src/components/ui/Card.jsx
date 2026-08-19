import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Card Component - Minimal Design
 * 
 * A clean, minimal card component with subtle elevation and optional hover effects.
 * Supports header and footer sections with subtle dividers.
 * 
 * Requirements: 4.1, 4.2, 4.4, 8.1, 8.2, 8.3, 8.4, 8.6
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.hoverable=false] - Enable hover shadow transition
 * @param {'sm'|'md'|'lg'} [props.padding='md'] - Padding size (sm=16px, md=24px, lg=32px)
 * @param {React.ReactNode} [props.header] - Optional header section
 * @param {React.ReactNode} [props.footer] - Optional footer section
 */
export const Card = ({
  children,
  className,
  hoverable = false,
  padding = 'md',
  header,
  footer,
  ...props
}) => {
  // Padding size mapping
  const paddingClasses = {
    sm: 'p-4',      // 16px
    md: 'p-6',      // 24px
    lg: 'p-8',      // 32px
  };

  return (
    <div
      className={cn(
        // Base styles - Requirement 8.2: Border radius 6px, base shadow, border
        'rounded-md',                                    // 6px border radius
        'shadow-sm',                                     // 0 1px 2px rgba(0,0,0,0.05)
        'border border-border-default',                  // 1px solid with 0.1 opacity
        'bg-bg-primary',                                 // Theme-aware background
        
        // Hover effect - Requirement 8.6: Hoverable prop with shadow transition
        hoverable && [
          'transition-shadow duration-slow ease-out',    // 200ms transition
          'hover:shadow-md',                             // 0 2px 4px rgba(0,0,0,0.08)
        ],
        
        // Remove padding from container if header/footer present
        header || footer ? '' : paddingClasses[padding],
        
        className
      )}
      {...props}
    >
      {/* Header Section - Requirement 8.4: Header with subtle dividers */}
      {header && (
        <>
          <div className={cn(
            paddingClasses[padding],
            'border-b border-border-default'             // Subtle divider (1px solid, 0.1 opacity)
          )}>
            {header}
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={header || footer ? paddingClasses[padding] : ''}>
        {children}
      </div>

      {/* Footer Section - Requirement 8.4: Footer with subtle dividers */}
      {footer && (
        <>
          <div className={cn(
            paddingClasses[padding],
            'border-t border-border-default'             // Subtle divider (1px solid, 0.1 opacity)
          )}>
            {footer}
          </div>
        </>
      )}
    </div>
  );
};

export default Card;
