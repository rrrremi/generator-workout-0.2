'use client'

import React, { useState, useEffect, useRef } from 'react';
import { muscleGroups, Muscle, MuscleSubGroup } from '@/lib/data/muscleGroups';

interface MuscleGroupPopupProps {
  groupId: string;
  groupLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectMuscle: (muscleId: string, selected: boolean) => void;
  selectedMuscles: Set<string>;
  maxSelections: number;
  totalSelected: number;
  // The specific subgroup to highlight (e.g., 'biceps' when opening from biceps button)
  highlightSubgroup?: string;
}

export default function MuscleGroupPopup({
  groupId,
  groupLabel,
  isOpen,
  onClose,
  onSelectMuscle,
  selectedMuscles,
  maxSelections,
  totalSelected,
  highlightSubgroup
}: MuscleGroupPopupProps) {
  // No longer need expandedSubGroups state as all subgroups are always shown
  const popupRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Auto-expand all subgroups when popup opens and highlight specific subgroup if provided
  useEffect(() => {
    if (isOpen) {
      const group = muscleGroups[groupId];
      if (group) {
        // If a specific subgroup should be highlighted (e.g., biceps when opening from biceps button)
        if (highlightSubgroup) {
          // Find the matching subgroup in this muscle group
          for (const [subGroupId, subGroup] of Object.entries(group.subGroups)) {
            const typedSubGroup = subGroup as MuscleSubGroup;
            // Check if this subgroup matches the highlight subgroup name
            if (subGroupId === highlightSubgroup || typedSubGroup.label.toLowerCase().includes(highlightSubgroup.toLowerCase())) {
              // Scroll to this subgroup after a short delay to ensure DOM is ready
              setTimeout(() => {
                const element = document.getElementById(`subgroup-${groupId}-${subGroupId}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Add a temporary highlight class
                  element.classList.add('bg-yellow-100');
                  setTimeout(() => {
                    element.classList.remove('bg-yellow-100');
                  }, 1500);
                }
              }, 100);
              break;
            }
          }
        }
      }
    }
  }, [isOpen, groupId, highlightSubgroup]);

  // Toggle select all muscles in a subgroup
  const toggleSelectAllInSubgroup = (subGroupId: string) => {
    const subGroup = muscleGroups[groupId]?.subGroups[subGroupId];
    if (!subGroup) return;
    
    const typedSubGroup = subGroup as MuscleSubGroup;
    const allSelected = typedSubGroup.muscles.every((muscle: Muscle) => {
      const formattedMuscleId = `${groupId}-${muscle.id}`;
      return selectedMuscles.has(formattedMuscleId);
    });
    
    if (allSelected) {
      // Deselect all in this subgroup
      typedSubGroup.muscles.forEach((muscle: Muscle) => {
        const formattedMuscleId = `${groupId}-${muscle.id}`;
        onSelectMuscle(formattedMuscleId, false);
      });
    } else {
      // Select all in this subgroup - no limit
      typedSubGroup.muscles.forEach((muscle: Muscle) => {
        const formattedMuscleId = `${groupId}-${muscle.id}`;
        onSelectMuscle(formattedMuscleId, true);
      });
    }
  };

  const getSelectedCountInSubGroup = (subGroupId: string) => {
    const subGroup = muscleGroups[groupId]?.subGroups[subGroupId];
    if (!subGroup) return 0;
    
    const typedSubGroup = subGroup as MuscleSubGroup;
    return typedSubGroup.muscles.filter((muscle: Muscle) => {
      const formattedMuscleId = `${groupId}-${muscle.id}`;
      return selectedMuscles.has(formattedMuscleId);
    }).length;
  };

  if (!isOpen) return null;

  const group = muscleGroups[groupId];
  if (!group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fadeIn">
      <div 
        ref={popupRef}
        className="bg-white rounded-lg shadow-xl w-11/12 max-w-sm max-h-[80vh] overflow-hidden flex flex-col animate-slideUp"
      >
        {/* Compact header */}
        <div className="sticky top-0 z-10 bg-black text-white px-3 py-2 flex justify-between items-center">
          <h3 className="text-sm font-medium">{groupLabel} Muscles ({totalSelected} selected)</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 p-1"
            aria-label="Close popup"
          >
            ✕
          </button>
        </div>

        {/* Error toast */}
        {error && (
          <div className="absolute top-12 left-0 right-0 mx-auto w-10/12 bg-red-500 text-white text-xs p-2 rounded animate-slideDown">
            {error}
          </div>
        )}

        {/* Compact content area with auto-expanded subgroups */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {Object.entries(group.subGroups).map(([subGroupId, subGroup]) => {
            const typedSubGroup = subGroup as MuscleSubGroup;
            const selectedCount = getSelectedCountInSubGroup(subGroupId);
            const allSelected = selectedCount === typedSubGroup.muscles.length && selectedCount > 0;
            
            return (
              <div 
                key={subGroupId} 
                id={`subgroup-${groupId}-${subGroupId}`}
                className="border-b pb-2"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <span className="font-medium text-xs">{typedSubGroup.label}</span>
                    {selectedCount > 0 && (
                      <span className="ml-1 text-xs bg-black text-white px-1 rounded-full">
                        {selectedCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => toggleSelectAllInSubgroup(subGroupId)}
                    className={`text-xs px-2 py-0.5 rounded ${allSelected ? 'bg-black text-white' : 'bg-gray-200'}`}
                  >
                    {allSelected ? 'Deselect' : 'Select All'}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {typedSubGroup.muscles.map((muscle) => {
                    // Format muscle ID with parent group prefix for proper association
                    const formattedMuscleId = `${groupId}-${muscle.id}`;
                    const isSelected = selectedMuscles.has(formattedMuscleId);
                    return (
                      <button
                        key={formattedMuscleId}
                        onClick={() => onSelectMuscle(formattedMuscleId, !isSelected)}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${isSelected 
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {muscle.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Simple footer */}
        <div className="bg-gray-50 px-3 py-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-black text-white px-4 py-1 text-xs rounded hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
