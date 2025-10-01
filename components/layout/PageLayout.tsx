'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageLayout component that provides a consistent layout structure using CSS Grid
 * Separates background effects from content for better performance and maintainability
 */
export const PageLayout: React.FC<PageLayoutProps> = ({ children, className = '' }) => {
  return (
    <main className={`grid grid-rows-[auto_1fr] min-h-screen ${className}`}>
      {/* Background effects - fixed and separate from content flow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
      </div>
      
      {/* Content area - scrollable and properly positioned */}
      <div className="relative z-10 grid grid-rows-[auto_1fr] gap-4">
        {children}
      </div>
    </main>
  );
};

export default PageLayout;
