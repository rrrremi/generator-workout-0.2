import React from 'react';

interface ExerciseVideoButtonProps {
  exerciseName: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'subtle';
}

export default function ExerciseVideoButton({ 
  exerciseName, 
  size = 'medium',
  variant = 'primary'
}: ExerciseVideoButtonProps) {
  const openYouTubeSearch = () => {
    const searchQuery = `${exerciseName}`; // Just use the exercise name as is
    // URL parameter sp=EgIYAQ%253D%253D filters for short videos
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=EgIYAQ%253D%253D`;
    
    window.open(youtubeSearchUrl, '_blank', 'noopener,noreferrer');
  };

  // Size classes
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2'
  };

  // Icon sizes
  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800',
    subtle: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300/50'
  };

  return (
    <button 
      onClick={openYouTubeSearch}
      className={`flex items-center gap-1.5 rounded transition-colors ${sizeClasses[size]} ${variantClasses[variant]}`}
      title={`Watch ${exerciseName} tutorial videos on YouTube`}
    >
      <svg className={iconSizes[size]} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      {size === 'small' ? 'Video' : 'Watch Videos'}
    </button>
  );
}
