'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  backLink?: string;
  backText?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader component that provides a consistent header with back navigation
 * Uses flexbox for proper alignment and spacing
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ 
  backLink, 
  backText = 'Back', 
  children,
  className = '' 
}) => {
  return (
    <header className={`flex items-center justify-between p-4 ${className}`}>
      {backLink ? (
        <Link href={backLink}>
          <button className="flex items-center gap-2 rounded-xl border border-transparent bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-xl hover:bg-white/10 transition-colors">
            <ChevronLeft className="h-4 w-4" />
            {backText}
          </button>
        </Link>
      ) : (
        <div></div> // Empty div to maintain flexbox spacing when no back link
      )}
      
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
