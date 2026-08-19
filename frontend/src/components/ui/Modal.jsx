import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

/**
 * Modal Component - Minimal Design
 * 
 * A clean, minimal modal component with subtle animations and accessibility features.
 * Includes focus trap, keyboard navigation, and backdrop click handling.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal should close
 * @param {string} [props.title] - Optional modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} [props.footer] - Optional footer section
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Modal size
 * @param {string} [props.className] - Additional CSS classes for content
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className,
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size mapping - Requirement 16.6: Support sizes sm, md, lg
  const sizeClasses = {
    sm: 'max-w-md',   // 448px
    md: 'max-w-lg',   // 512px
    lg: 'max-w-2xl',  // 672px
  };

  // Requirement 16.4: Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    // Store the element that had focus before modal opened
    previousActiveElement.current = document.activeElement;

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Focus the modal container
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      
      // Restore focus to the element that opened the modal
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Requirement 16.5: Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Requirement 16.4: Focus trap - keep focus within modal
  const handleKeyDown = (event) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Requirement 16.6: Backdrop click handler
  const handleBackdropClick = (event) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Requirement 16.1: Backdrop with fade-in (200ms, opacity 0.5) */}
      <div
        className="absolute inset-0 bg-black animate-modal-backdrop"
        style={{ opacity: 0.5 }}
        aria-hidden="true"
      />

      {/* Requirement 16.2: Content with fade-in (200ms, no scale transform) */}
      <div
        ref={modalRef}
        className={cn(
          // Base styles - Card component patterns
          'relative',
          'rounded-md',                                    // 6px border radius
          'shadow-lg',                                     // Subtle elevation
          'border border-border-default',                  // Clean borders (1px solid, 0.1 opacity)
          'bg-bg-primary',                                 // Theme-aware background
          'w-full',
          sizeClasses[size],
          'max-h-[90vh]',
          'flex flex-col',
          
          // Requirement 16.2: Fade-in animation (200ms, no scale)
          'animate-modal-content',
          
          className
        )}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header Section */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border-default">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-text-primary"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                'p-2',
                'text-text-tertiary',
                'hover:text-text-primary',
                'rounded-sm',
                'hover:bg-bg-secondary',
                'transition-colors duration-normal'
              )}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 z-10',
              'p-2',
              'text-text-tertiary',
              'hover:text-text-primary',
              'rounded-sm',
              'hover:bg-bg-secondary',
              'transition-colors duration-normal'
            )}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content Section - Generous padding */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer Section */}
        {footer && (
          <div className="p-6 border-t border-border-default">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
