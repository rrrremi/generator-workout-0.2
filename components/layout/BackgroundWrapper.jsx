"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for the Silk component
// This prevents hydration errors since Three.js requires browser APIs
const Silk = dynamic(() => import('../ui/Silk'), { ssr: false });

const BackgroundWrapper = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* Background layer - fixed position, full screen */}
      <div className="fixed inset-0 z-0">
        {isMounted && (
          <Silk 
            speed={2} 
            scale={1.5} 
            color="#1a1425" 
            noiseIntensity={1.2} 
            rotation={0.2}
          />
        )}
        {/* Subtle overlay to improve content visibility */}
        <div className="absolute inset-0 bg-black/10 z-0"></div>
      </div>
      
      {/* Content layer - positioned above the background */}
      <div className="relative z-10 min-h-screen w-full">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;
