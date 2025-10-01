/**
 * Comprehensive muscle groups data structure
 * Organized hierarchically: Muscle Group > Subgroup > Individual Muscles
 */

export interface Muscle {
  id: string;
  name: string;
  description?: string;
}

export interface MuscleSubGroup {
  label: string;
  muscles: Muscle[];
}

export interface MuscleGroup {
  label: string;
  subGroups: Record<string, MuscleSubGroup>;
}

export const muscleGroups: Record<string, MuscleGroup> = {
  chest: {
    label: "Chest",
    subGroups: {
      upper: {
        label: "Upper Chest",
        muscles: [
          { id: "upper_pectoralis", name: "Upper Pectoralis Major" },
          { id: "clavicular_head", name: "Clavicular Head" }
        ]
      },
      mid: {
        label: "Mid Chest",
        muscles: [
          { id: "mid_pectoralis", name: "Mid Pectoralis Major" }
        ]
      },
      lower: {
        label: "Lower Chest",
        muscles: [
          { id: "lower_pectoralis", name: "Lower Pectoralis Major" },
          { id: "sternal_head", name: "Sternal Head" }
        ]
      },
      inner: {
        label: "Inner Chest",
        muscles: [
          { id: "pectoralis_minor", name: "Pectoralis Minor" }
        ]
      }
    }
  },
  back: {
    label: "Back",
    subGroups: {
      upper: {
        label: "Upper Back",
        muscles: [
          { id: "trapezius", name: "Trapezius" },
          { id: "rhomboids", name: "Rhomboids" },
          { id: "rear_deltoids", name: "Rear Deltoids" }
        ]
      },
      mid: {
        label: "Mid Back",
        muscles: [
          { id: "latissimus_dorsi", name: "Latissimus Dorsi" },
          { id: "teres_major", name: "Teres Major" },
          { id: "teres_minor", name: "Teres Minor" }
        ]
      },
      lower: {
        label: "Lower Back",
        muscles: [
          { id: "erector_spinae", name: "Erector Spinae" },
          { id: "multifidus", name: "Multifidus" }
        ]
      }
    }
  },
  shoulders: {
    label: "Shoulders",
    subGroups: {
      anterior: {
        label: "Front Deltoids",
        muscles: [
          { id: "anterior_deltoid", name: "Anterior Deltoid" }
        ]
      },
      lateral: {
        label: "Side Deltoids",
        muscles: [
          { id: "lateral_deltoid", name: "Lateral Deltoid" }
        ]
      },
      posterior: {
        label: "Rear Deltoids",
        muscles: [
          { id: "posterior_deltoid", name: "Posterior Deltoid" }
        ]
      },
      rotator: {
        label: "Rotator Cuff",
        muscles: [
          { id: "supraspinatus", name: "Supraspinatus" },
          { id: "infraspinatus", name: "Infraspinatus" },
          { id: "subscapularis", name: "Subscapularis" }
        ]
      }
    }
  },
  biceps: {
    label: "Biceps",
    subGroups: {
      main: {
        label: "Biceps",
        muscles: [
          { id: "biceps_brachii", name: "Biceps Brachii" },
          { id: "brachialis", name: "Brachialis" },
          { id: "brachioradialis", name: "Brachioradialis" }
        ]
      }
    }
  },
  triceps: {
    label: "Triceps",
    subGroups: {
      main: {
        label: "Triceps",
        muscles: [
          { id: "triceps_long_head", name: "Triceps Long Head" },
          { id: "triceps_lateral_head", name: "Triceps Lateral Head" },
          { id: "triceps_medial_head", name: "Triceps Medial Head" }
        ]
      }
    }
  },
  forearms: {
    label: "Forearms",
    subGroups: {
      main: {
        label: "Forearms",
        muscles: [
          { id: "flexors", name: "Wrist Flexors" },
          { id: "extensors", name: "Wrist Extensors" },
          { id: "pronators", name: "Pronators" },
          { id: "supinators", name: "Supinators" }
        ]
      }
    }
  },
  neck: {
    label: "Neck",
    subGroups: {
      main: {
        label: "Neck Muscles",
        muscles: [
          { id: "sternocleidomastoid", name: "Sternocleidomastoid" },
          { id: "levator_scapulae", name: "Levator Scapulae" },
          { id: "scalenes", name: "Scalenes" }
        ]
      }
    }
  },
  core: {
    label: "Core",
    subGroups: {
      abs: {
        label: "Abdominals",
        muscles: [
          { id: "rectus_abdominis", name: "Rectus Abdominis" },
          { id: "transverse_abdominis", name: "Transverse Abdominis" }
        ]
      },
      obliques: {
        label: "Obliques",
        muscles: [
          { id: "external_obliques", name: "External Obliques" },
          { id: "internal_obliques", name: "Internal Obliques" }
        ]
      },
      lower_back: {
        label: "Lower Back",
        muscles: [
          { id: "erector_spinae_core", name: "Erector Spinae" },
          { id: "quadratus_lumborum", name: "Quadratus Lumborum" }
        ]
      }
    }
  },
  glutes: {
    label: "Glutes",
    subGroups: {
      main: {
        label: "Glutes",
        muscles: [
          { id: "gluteus_maximus", name: "Gluteus Maximus" },
          { id: "gluteus_medius", name: "Gluteus Medius" },
          { id: "gluteus_minimus", name: "Gluteus Minimus" }
        ]
      }
    }
  },
  quads: {
    label: "Quads",
    subGroups: {
      main: {
        label: "Quadriceps",
        muscles: [
          { id: "rectus_femoris", name: "Rectus Femoris" },
          { id: "vastus_lateralis", name: "Vastus Lateralis" },
          { id: "vastus_medialis", name: "Vastus Medialis" },
          { id: "vastus_intermedius", name: "Vastus Intermedius" }
        ]
      }
    }
  },
  hamstrings: {
    label: "Hamstrings",
    subGroups: {
      main: {
        label: "Hamstrings",
        muscles: [
          { id: "biceps_femoris", name: "Biceps Femoris" },
          { id: "semitendinosus", name: "Semitendinosus" },
          { id: "semimembranosus", name: "Semimembranosus" }
        ]
      }
    }
  },
  calves: {
    label: "Calves",
    subGroups: {
      main: {
        label: "Calves",
        muscles: [
          { id: "gastrocnemius", name: "Gastrocnemius" },
          { id: "soleus", name: "Soleus" },
          { id: "tibialis_anterior", name: "Tibialis Anterior" }
        ]
      }
    }
  }
};

// Helper function to get all muscles as a flat array
export function getAllMuscles(): Muscle[] {
  const allMuscles: Muscle[] = [];
  
  Object.values(muscleGroups).forEach(group => {
    Object.values(group.subGroups).forEach(subGroup => {
      allMuscles.push(...subGroup.muscles);
    });
  });
  
  return allMuscles;
}

// Helper function to map muscle IDs to their display names
export function getMuscleNameById(id: string): string | undefined {
  const allMuscles = getAllMuscles();
  const muscle = allMuscles.find(m => m.id === id);
  return muscle?.name;
}

// Helper function to get the parent muscle group ID for a given muscle ID
export function getParentGroupId(muscleId: string): string | null {
  for (const [groupId, group] of Object.entries(muscleGroups)) {
    for (const subGroup of Object.values(group.subGroups)) {
      if (subGroup.muscles.some(m => m.id === muscleId)) {
        return groupId;
      }
    }
  }
  return null;
}

// Helper function to map detailed muscle selections to simplified categories
export function mapToSimplifiedCategories(selectedMuscles: string[]): string[] {
  // If no detailed muscles are selected, return empty array
  if (!selectedMuscles || selectedMuscles.length === 0) {
    return [];
  }

  const categories = new Set<string>();

  // For each selected muscle ID
  for (const muscleId of selectedMuscles) {
    // Check if this is a formatted ID (e.g., "chest-upper_pectoralis")
    if (muscleId.includes('-')) {
      // Extract the parent group ID
      const parentGroupId = muscleId.split('-')[0];
      categories.add(parentGroupId);
    } else {
      // This is a regular muscle ID (e.g., "chest"), add it directly
      categories.add(muscleId);
    }
  }
  
  return Array.from(categories);
}
