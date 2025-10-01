/**
 * Exercise name matching utilities
 * 
 * These functions help normalize exercise names to prevent duplicates
 * when the same exercise might be written in different ways.
 */

/**
 * Creates a search key from an exercise name by:
 * 1. Converting to lowercase
 * 2. Removing non-letters
 * 3. Splitting into words
 * 4. Sorting alphabetically
 * 5. Joining with no separator
 * 
 * This ensures that variations like "Barbell Bench Press" and
 * "Bench Press Barbell" will generate the same key.
 * 
 * @param exerciseName The exercise name to normalize
 * @returns A normalized search key
 */
export function createSearchKey(exerciseName: string): string {
  // Convert to lowercase, remove non-letters, split into words, sort, and join
  return exerciseName
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')  // Keep only letters and spaces
    .split(/\s+/)              // Split by whitespace
    .filter(word => word.length > 0)  // Remove empty strings
    .sort()                    // Sort alphabetically
    .join('');                 // Join with no separator
}

/**
 * Extract equipment type from an exercise name
 * 
 * @param exerciseName The exercise name to parse
 * @returns The equipment type or 'bodyweight' if none found
 */
export function extractEquipment(exerciseName: string): string {
  const equipmentTypes = [
    'barbell', 
    'dumbbell', 
    'cable', 
    'machine', 
    'kettlebell', 
    'resistance band', 
    'ez bar',
    'suspension trainer',
    'wall',
    'chair',
    'bench'
  ];
  
  const lowerName = exerciseName.toLowerCase();
  
  // Check for isometric exercises that might use specific equipment
  if (lowerName.includes('isometric') || lowerName.includes('hold') || lowerName.includes('plank')) {
    // Check if any equipment is mentioned
    for (const equipment of equipmentTypes) {
      if (lowerName.includes(equipment)) {
        return equipment;
      }
    }
    
    // If no specific equipment is mentioned, it's likely bodyweight
    return 'bodyweight';
  }
  
  // Standard equipment check
  for (const equipment of equipmentTypes) {
    if (lowerName.includes(equipment)) {
      return equipment;
    }
  }
  
  return 'bodyweight';
}

// No movement type determination - removed as it's not needed

/**
 * Test if the matcher is working correctly
 */
export function testMatcher(): void {
  console.log('Testing exercise name matcher:');
  console.log('------------------------------');
  console.log('"Barbell Bench Press" →', createSearchKey("Barbell Bench Press"));
  console.log('"Bench Press Barbell" →', createSearchKey("Bench Press Barbell"));
  console.log('"BENCH-PRESS (Barbell)" →', createSearchKey("BENCH-PRESS (Barbell)"));
  console.log('"DB Shoulder Press" →', createSearchKey("DB Shoulder Press"));
  console.log('------------------------------');
}
