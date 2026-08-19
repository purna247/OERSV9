import React from 'react';
import { cn } from '../../utils/cn';

/**
 * PageContainer Component
 *
 * A consistent wrapper for all page content. Provides:
 * - Max width 1280px with centered layout
 * - Responsive padding: 24px (mobile) → 32px (tablet) → 48px (desktop)
 * - Theme-aware background (#f8f9fc light / #121317 dark via bg-bg-secondary token)
 * - Min height 100vh
 *
 * Requirements: 8.1, 8.3, 19.1, 19.2
 *
 * @param {Object}  props
 * @param {React.ReactNode} props.children
 * @param {string}  [props.className] - Additional classes
 * @param {boolean} [props.noPadding=false] - Skip default padding (e.g. full-bleed pages)
 */
export const PageContainer = ({ children, className, noPadding = false }) => (
  <div className="min-h-screen bg-bg-secondary">
    <div
      className={cn(
        'mx-auto w-full max-w-[1280px]',
        !noPadding && 'px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10',
        className
      )}
    >
      {children}
    </div>
  </div>
);

export default PageContainer;
