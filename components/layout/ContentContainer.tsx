'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

/**
 * ContentContainer component that provides a consistent container for page content
 * Uses CSS Grid for flexible content layout
 */
export const ContentContainer: React.FC<ContentContainerProps> = ({ 
  children, 
  className = '',
  animate = true
}) => {
  const Container = animate ? motion.div : 'div';
  
  return (
    <Container 
      className={`mx-auto w-full max-w-4xl px-4 pb-20 ${className}`}
      {...(animate ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 }
      } : {})}
    >
      <div className="grid gap-6">
        {children}
      </div>
    </Container>
  );
};

export default ContentContainer;
