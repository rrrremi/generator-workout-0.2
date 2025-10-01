import OpenAI from 'openai';
import { WorkoutData } from '@/types/workout';
import { BASE_WORKOUT_PROMPT, RETRY_PROMPT_SUFFIX, focusInstructions } from './prompts/workout';
import { EXERCISE_DATABASE_PROMPT, EXERCISE_DATABASE_RETRY_PROMPT } from './prompts/exercise_database';

export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-3.5-turbo';

// Initialize OpenAI client with better error handling
const initializeOpenAI = () => {
  // Check if API key exists
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not defined in environment variables');
    throw new Error('OpenAI API key is missing');
  }

  try {
    // Get the API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Log the API key prefix for debugging (safely)
    console.log('API key prefix:', apiKey?.substring(0, 7) + '...');
    console.log('API key length:', apiKey?.length);
    console.log('Using OpenAI model:', DEFAULT_OPENAI_MODEL);
    
    // For OpenAI v4, we need to use a standard API key (sk-*) not a project key (sk-proj-*)
    // If you're using a project key, you need to get a standard API key from your OpenAI account
    // or configure your application to use the project key correctly
    
    // Create the OpenAI client
    return new OpenAI({
      apiKey: apiKey,
      timeout: 60000, // 60 seconds timeout
      maxRetries: 2,  // Retry API calls up to 2 times
      baseURL: "https://api.openai.com/v1", // Explicitly set the base URL
    });
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    throw error;
  }
};

const openai = initializeOpenAI();

/**
 * Result of workout generation
 */
export interface GenerateWorkoutResult {
  success: boolean;
  data?: WorkoutData;
  error?: string;
  rawResponse?: string;
  parseAttempts?: number;
  generationTimeMs?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate a workout prompt based on user inputs
 * 
 * @param muscleFocus Array of muscle groups to focus on
 * @param workoutFocus Type of workout (hypertrophy, strength, etc)
 * @param exerciseCount Number of exercises to generate
 * @param specialInstructions Any special instructions
 * @param retry Whether this is a retry attempt
 * @param useExerciseDatabase Whether to use the enhanced exercise database prompt
 * @returns The generated prompt
 */
/**
 * Build the full prompt string that is sent to the OpenAI model.
 *
 * Design goals:
 * - Keep a stable, instruction-heavy "base" prompt (or the exercise-database variant) that encodes
 *   structure, safety and quality rules.
 * - Inject user inputs (muscle focus, workout focus, exercise count, special instructions) in a
 *   clearly labeled section so the model can condition on them.
 * - Optionally append a retry suffix that reinforces JSON constraints if the first attempt failed.
 * - Optionally use the enhanced exercise database prompt to request richer fields per exercise.
 */
export function generateWorkoutPrompt(
  muscleFocus: string[] = [], 
  workoutFocus: string[] = ['hypertrophy'], 
  exerciseCount: number = 4,
  specialInstructions: string = '',
  retry = false,
  useExerciseDatabase = true
): string {
  // 1) Start with the appropriate base prompt
  // - Standard base (BASE_WORKOUT_PROMPT) gives a simple schema and rules
  // - Exercise DB base (EXERCISE_DATABASE_PROMPT) requests additional fields
  let prompt = useExerciseDatabase ? EXERCISE_DATABASE_PROMPT : BASE_WORKOUT_PROMPT;
  
  // 2) If this is a retry attempt, append a stricter retry suffix that reiterates JSON-only output
  if (retry) {
    prompt += useExerciseDatabase ? EXERCISE_DATABASE_RETRY_PROMPT : RETRY_PROMPT_SUFFIX;
  }
  
  // 3) If no muscle focus was provided, return the base prompt as-is (model may choose muscles)
  if (muscleFocus.length === 0) {
    return prompt;
  }
  
  // 4) Pull focus-specific "coaching" rules (e.g., hypertrophy vs. strength)
  // Get the primary focus type (first in the array)
  const primaryFocusType = workoutFocus[0].toLowerCase();
  const specificInstructions = focusInstructions[primaryFocusType as keyof typeof focusInstructions] || 
    "Use balanced approach with moderate intensity, focus on proper form and technique";
  
  // Select the appropriate base prompt template
  let basePrompt = useExerciseDatabase ? EXERCISE_DATABASE_PROMPT : BASE_WORKOUT_PROMPT;
  
  // If this is a retry attempt, append a stricter retry suffix
  if (retry) {
    basePrompt += useExerciseDatabase ? EXERCISE_DATABASE_RETRY_PROMPT : RETRY_PROMPT_SUFFIX;
  }
  
  // Replace template variables with actual values
  let customPrompt = basePrompt
    .replace(/\{\{muscleFocus\}\}/g, muscleFocus.join(', '))
    .replace(/\{\{workoutFocus\}\}/g, workoutFocus.join(', '))
    .replace(/\{\{exerciseCount\}\}/g, exerciseCount.toString())
    .replace(/\{\{minExercisesForMuscle\}\}/g, Math.max(1, Math.ceil(exerciseCount * 0.6)).toString())
    .replace(/\{\{focusSpecificInstructions\}\}/g, specificInstructions);
    
  // Handle special instructions if provided
  if (specialInstructions && specialInstructions.trim()) {
    // Use a function to handle multiline matching instead of 's' flag
    customPrompt = customPrompt.replace(/\{\{#specialInstructions\}\}([\s\S]+?)\{\{\/specialInstructions\}\}/g, 
      (match, p1) => p1.replace(/\{\{specialInstructions\}\}/g, specialInstructions.trim()));
  } else {
    // Remove the special instructions placeholder if none provided
    customPrompt = customPrompt.replace(/\{\{#specialInstructions\}\}([\s\S]+?)\{\{\/specialInstructions\}\}/g, '');
  }

  return customPrompt;
}

/**
 * Validate the workout data structure and values
 * @param data The parsed JSON data
 * @param expectedExerciseCount Optional expected number of exercises
 * @param useExerciseDatabase Whether to validate enhanced exercise database fields
 * @returns Validation result
 */
function validateWorkoutData(data: any, expectedExerciseCount?: number, useExerciseDatabase = true): { valid: boolean; error?: string } {
  // Check if the data has a workout object
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Response is not an object' };
  }
  
  if (!data.workout) {
    return { valid: false, error: 'Missing workout object' };
  }
  
  // Check if the workout has an exercises array
  if (!Array.isArray(data.workout.exercises)) {
    return { valid: false, error: 'Workout does not contain an exercises array' };
  }
  
  // Check if the exercises array is empty
  if (data.workout.exercises.length === 0) {
    return { valid: false, error: 'Exercises array is empty' };
  }
  
  // Check if the exercises count is reasonable compared to expected count
  // Relaxed: do not fail the whole response if count differs. We only require at least 1 exercise.
  if (expectedExerciseCount) {
    if (data.workout.exercises.length < 1) {
      return { valid: false, error: 'Exercises array is empty after generation' };
    }
    // Log a warning but allow processing to continue if count differs
    if (
      data.workout.exercises.length < expectedExerciseCount - 2 ||
      data.workout.exercises.length > expectedExerciseCount + 2
    ) {
      console.warn(
        `Workout exercise count differs from request: expected ~${expectedExerciseCount}, got ${data.workout.exercises.length}`
      );
    }
  }
  
  // Check each exercise for required fields
  for (let i = 0; i < data.workout.exercises.length; i++) {
    const exercise = data.workout.exercises[i];
    
    if (!exercise.name || typeof exercise.name !== 'string') {
      return { valid: false, error: `Exercise at index ${i} is missing a name` };
    }
    
    if (typeof exercise.sets !== 'number' || exercise.sets <= 0) {
      return { valid: false, error: `Exercise ${exercise.name} has invalid sets` };
    }
    
    // Allow reps to be either a number or a string (for time-based exercises or special instructions)
    if (typeof exercise.reps === 'number' && exercise.reps <= 0) {
      return { valid: false, error: `Exercise ${exercise.name} has invalid reps value` };
    } else if (typeof exercise.reps !== 'number' && typeof exercise.reps !== 'string') {
      return { valid: false, error: `Exercise ${exercise.name} has invalid reps type` };
    } else if (typeof exercise.reps === 'string' && exercise.reps.trim() === '') {
      return { valid: false, error: `Exercise ${exercise.name} has empty reps string` };
    }
    
    if (typeof exercise.rest_time_seconds !== 'number' || exercise.rest_time_seconds < 0) {
      return { valid: false, error: `Exercise ${exercise.name} has invalid rest time` };
    }
    
    if (!exercise.rationale || typeof exercise.rationale !== 'string') {
      return { valid: false, error: `Exercise ${exercise.name} is missing a rationale` };
    }
    
    // Validate enhanced exercise database fields if required
    if (useExerciseDatabase) {
      // Check primary_muscles
      if (!Array.isArray(exercise.primary_muscles) || exercise.primary_muscles.length === 0) {
        return { valid: false, error: `Exercise ${exercise.name} is missing primary_muscles array` };
      }
      
      // Check secondary_muscles (can be empty array but must be an array)
      if (!Array.isArray(exercise.secondary_muscles)) {
        return { valid: false, error: `Exercise ${exercise.name} is missing secondary_muscles array` };
      }
      
      // Check equipment
      if (!exercise.equipment || typeof exercise.equipment !== 'string') {
        return { valid: false, error: `Exercise ${exercise.name} is missing equipment` };
      }
      
      // Check movement_type
      if (!exercise.movement_type || (exercise.movement_type !== 'compound' && exercise.movement_type !== 'isolation')) {
        return { valid: false, error: `Exercise ${exercise.name} has invalid movement_type` };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Generate a workout using OpenAI
 * 
 * @param requestData The workout generation request data
 * @param retry Whether this is a retry attempt
 * @param useExerciseDatabase Whether to use the enhanced exercise database prompt
 * @returns The generated workout data
 */
export async function generateWorkout(
  requestData: {
    muscleFocus: string[];
    workoutFocus: string[];
    exerciseCount: number;
    specialInstructions?: string;
    difficulty?: string;
  },
  retry = false,
  useExerciseDatabase = true
): Promise<GenerateWorkoutResult> {
  const startTime = Date.now();
  let parseAttempts = 1;
  
  try {
    // Diagnostics: the following log helps trace runtime parameters for debugging
    console.log('Starting workout generation with parameters:', {
      muscleFocus: requestData.muscleFocus,
      workoutFocus: requestData.workoutFocus,
      exerciseCount: requestData.exerciseCount,
      specialInstructionsLength: requestData.specialInstructions?.length || 0,
      retry,
      useExerciseDatabase
    });

    // Build the final prompt string using the helper above
    const prompt = generateWorkoutPrompt(
      requestData.muscleFocus, 
      requestData.workoutFocus, 
      requestData.exerciseCount, 
      requestData.specialInstructions || '',
      retry,
      useExerciseDatabase
    );
    
    // Debug log
    console.log('Sending prompt to OpenAI:', prompt.substring(0, 100) + '...');
    
    // Heuristic: increase max_tokens proportionally to requested exercise count
    const baseTokens = 1000;
    const tokensPerExercise = 200;
    const maxTokens = Math.min(4000, baseTokens + (requestData.exerciseCount * tokensPerExercise));
    
    console.log(`Using max_tokens=${maxTokens} for ${requestData.exerciseCount} exercises`);
    
    // Sanity-check: the singleton client should have been created above
    if (!openai) {
      throw new Error('OpenAI client is not initialized');
    }

    console.log('Attempting to call OpenAI API...');
    
    // Make the OpenAI call with a timeout to avoid hanging the request on network issues
    let response: any;
    try {
      response = await Promise.race([
        openai.chat.completions.create({
          model: DEFAULT_OPENAI_MODEL,
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.7,
          max_tokens: maxTokens,
          // @ts-ignore - response_format is supported in newer versions
          response_format: { type: "json_object" }, // Ensure response is valid JSON
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API timeout')), 30000)
        )
      ]);
      console.log('Successfully received response from OpenAI');
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      if (apiError instanceof Error) {
        console.error('Error details:', apiError.message);
        if ('status' in apiError) {
          console.error('API status code:', (apiError as any).status);
        }
      }
      throw apiError;
    }
    
    // Parse the JSON response (model is asked to return JSON only; we still guard with fallbacks)
    const responseText = response.choices?.[0]?.message?.content || '';
    
    try {
      // Try to parse the entire response as JSON
      let jsonStr = responseText.trim();
      let parsedData;
      
      try {
        // First attempt: parse the entire response
        parsedData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.log('First parse attempt failed, trying to extract JSON...');
        
        // Second attempt: try to extract JSON from the response using regex
        const jsonMatch = responseText.match(/\{[\s\S]*\}/m);
        if (!jsonMatch) {
          // Third attempt: look for code blocks that might contain JSON
          const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            console.log('Found JSON in code block, attempting to parse...');
            jsonStr = codeBlockMatch[1].trim();
            parsedData = JSON.parse(jsonStr);
          } else {
            throw new Error('Could not find JSON in response');
          }
        } else {
          jsonStr = jsonMatch[0];
          parsedData = JSON.parse(jsonStr);
        }
        parseAttempts++;
      }
      
      // Validate the parsed data against our expected shape
      let validationResult = validateWorkoutData(parsedData, requestData.exerciseCount, useExerciseDatabase);
      
      // If validation fails with exercise database fields, try validating without them
      if (!validationResult.valid && useExerciseDatabase) {
        console.log(`Validation failed with exercise database fields: ${validationResult.error}`);
        console.log('Trying validation without exercise database fields...');
        validationResult = validateWorkoutData(parsedData, requestData.exerciseCount, false);
        
        if (validationResult.valid) {
          console.log('Validation succeeded without exercise database fields');
        }
      }
      
      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }
      
      // Return success result
      return {
        success: true,
        data: parsedData.workout,
        rawResponse: responseText,
        parseAttempts,
        generationTimeMs: Date.now() - startTime,
        usage: {
          promptTokens: 0, // We'll need to handle this differently with v4
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', responseText);
      
      // If this is already a retry, give up
      if (retry) {
        return {
          success: false,
          error: `Failed to parse response after retry: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          rawResponse: responseText,
          parseAttempts,
          generationTimeMs: Date.now() - startTime,
        };
      }
      
      // Retry once with stricter prompt advice if parsing/validation failed the first time
      console.log('Retrying with more explicit prompt...');
      parseAttempts++;
      return generateWorkout(requestData, true, useExerciseDatabase);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      parseAttempts,
      generationTimeMs: Date.now() - startTime,
    };
  }
}
