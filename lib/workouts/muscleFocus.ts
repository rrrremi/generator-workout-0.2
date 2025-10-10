export interface ExerciseLike {
  primary_muscles?: string[] | string | null;
  primary_muscle?: string | null;
  secondary_muscles?: string[] | string | null;
}

const toArray = (value?: string[] | string | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.replace(/["]+/g, '').trim())
      .filter(Boolean);
  }

  return [];
};

export const deriveMuscleFocusFromExercises = (
  exercises?: ExerciseLike[] | null
): {
  muscleFocus: string[];
  muscleGroupsTargeted: string;
} => {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return { muscleFocus: [], muscleGroupsTargeted: '' };
  }

  const muscles = new Set<string>();

  exercises.forEach((exercise) => {
    toArray(exercise.primary_muscles).forEach((muscle) => muscles.add(muscle));
    toArray(exercise.secondary_muscles).forEach((muscle) => muscles.add(muscle));

    // Support legacy primary_muscle string field
    toArray(exercise.primary_muscle).forEach((muscle) => muscles.add(muscle));
  });

  const muscleFocus = Array.from(muscles).sort((a, b) => a.localeCompare(b));

  return {
    muscleFocus,
    muscleGroupsTargeted: muscleFocus.join(', '),
  };
};
