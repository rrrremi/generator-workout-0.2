import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Workout } from '@/types/workout';
import { ChevronRight, Calendar, Dumbbell } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SimilarWorkoutSuggestionsProps {
  muscleFocus: string[];
  workoutFocus: string[];
  isVisible: boolean;
}

export default function SimilarWorkoutSuggestions({
  muscleFocus,
  workoutFocus,
  isVisible
}: SimilarWorkoutSuggestionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [similarWorkouts, setSimilarWorkouts] = useState<(Workout & { matchPercentage: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Only search when both arrays have at least one item
  const shouldSearch = muscleFocus.length > 0 && workoutFocus.length > 0;
  
  // Combine the arrays for debouncing
  const searchParams = JSON.stringify({ muscleFocus, workoutFocus });
  const debouncedSearchParams = useDebounce(searchParams, 2000); // 2 second delay
  
  useEffect(() => {
    const searchParams = JSON.parse(debouncedSearchParams);
    const { muscleFocus, workoutFocus } = searchParams;
    
    async function fetchSimilarWorkouts() {
      // Double-check that we have at least one item in each array and component should be visible
      if (!shouldSearch || !isVisible || muscleFocus.length === 0 || workoutFocus.length === 0) {
        setSimilarWorkouts([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Fetch all user's workouts
        const { data: workouts, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (workouts) {
          // Calculate match percentage for each workout
          const workoutsWithMatchPercentage = workouts.map((workout: Workout) => {
            // Calculate muscle focus match
            const muscleMatches = workout.muscle_focus.filter((muscle: string) => 
              muscleFocus.includes(muscle)
            ).length;
            
            const muscleMatchPercentage = muscleFocus.length > 0 
              ? (muscleMatches / Math.max(muscleFocus.length, workout.muscle_focus.length)) * 100
              : 0;
              
            // Calculate workout focus match
            const focusMatches = workout.workout_focus.filter((focus: string) => 
              workoutFocus.includes(focus)
            ).length;
            
            const focusMatchPercentage = workoutFocus.length > 0
              ? (focusMatches / Math.max(workoutFocus.length, workout.workout_focus.length)) * 100
              : 0;
              
            // Overall match percentage (average of both)
            const matchPercentage = (muscleMatchPercentage + focusMatchPercentage) / 2;
            
            // Check if it's an exact match (same number and same items)
            const isExactMuscleMatch = 
              muscleFocus.length === workout.muscle_focus.length && 
              muscleFocus.every((m: string) => workout.muscle_focus.includes(m));
              
            const isExactFocusMatch = 
              workoutFocus.length === workout.workout_focus.length && 
              workoutFocus.every((f: string) => workout.workout_focus.includes(f));
              
            // If both are exact matches, set to 100%
            const finalMatchPercentage = (isExactMuscleMatch && isExactFocusMatch) 
              ? 100 
              : matchPercentage;
              
            return {
              ...workout,
              matchPercentage: finalMatchPercentage
            };
          });
          
          // Filter workouts with at least 30% match
          const filteredWorkouts = workoutsWithMatchPercentage.filter(
            workout => workout.matchPercentage >= 30
          );
          
          // Sort by match percentage (highest first)
          const sortedWorkouts = filteredWorkouts.sort(
            (a, b) => b.matchPercentage - a.matchPercentage
          );
          
          setSimilarWorkouts(sortedWorkouts);
        }
      } catch (error) {
        console.error('Error fetching similar workouts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSimilarWorkouts();
  }, [debouncedSearchParams, shouldSearch, isVisible, supabase]);
  
  if (!isVisible || similarWorkouts.length === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <div className="text-xs text-white/70 mb-2 flex items-center gap-1.5">
          <Dumbbell className="h-3 w-3" />
          Similar workouts you've created:
        </div>
        
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-3">
              <div className="inline-block h-4 w-4 border-2 border-white/20 border-t-fuchsia-400 rounded-full animate-spin"></div>
            </div>
          ) : (
            similarWorkouts.map(workout => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-transparent bg-white/5 backdrop-blur-sm overflow-hidden"
              >
                <button
                  onClick={() => router.push(`/protected/workouts/${workout.id}`)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white truncate">
                        {workout.name || `Workout ${new Date(workout.created_at).toLocaleDateString()}`}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300">
                        {Math.round(workout.matchPercentage)}% match
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex flex-wrap gap-1">
                        {workout.muscle_focus.map((muscle: string) => (
                          <span 
                            key={muscle} 
                            className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              muscleFocus.includes(muscle)
                                ? 'bg-fuchsia-500/30 text-fuchsia-200'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                      <span className="text-white/30 text-[10px]">•</span>
                      <div className="flex flex-wrap gap-1">
                        {workout.workout_focus.map((focus: string) => (
                          <span 
                            key={focus} 
                            className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              workoutFocus.includes(focus)
                                ? 'bg-cyan-500/30 text-cyan-200'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
