/**
 * Workout generation prompts
 * This file contains all prompts used for workout generation
 */

// Workout focus specific instructions
export const focusInstructions = {
  cardio: "Sustained effort 20+ min at 65–85% HRmax. Use steady state or intervals (1:1–3:1 work:rest). Emphasize aerobic capacity and efficiency.",
  hypertrophy: "5–30 reps @65–85% 1RM, 60–180s rest, 2–8s rep tempo. Prioritize volume, mechanical tension, metabolic stress. Proximity to failure > exact reps.",
  isolation: "Single-joint, 8–25 reps @50–75% 1RM, 45–90s rest. Refine technique, target fibers with higher volume.",
  strength: "1–6 reps @80–95% 1RM, 2–5 min rest. Compound lifts, progressive overload. Focus on max force production.",
  speed: "3–8 reps @30–60% 1RM moved explosively, 2–4 min rest. Emphasize velocity, full recovery, avoid fatigue.",
  stability: "Unilateral/anti-movement patterns, 8–15 reps, 60–120s rest. Prioritize motor control, proprioception, controlled tempo.",
  activation: "Prep/mind–muscle work, 12–25 reps @20–50% 1RM, 30–60s rest. Groove patterns, tissue warm-up.",
  stretch: "Static 30–60s post-workout, dynamic pre-workout. Aim for ROM gains & prep.",
  mobility: "Controlled articular rotations, loaded stretches, flows. 10–15 reps, 2–3s end-range holds.",
  plyometric: "3–8 explosive reps, 2–5 min rest. Focus on landing mechanics, reactive strength, elastic energy use.",
  isometric: "Static holds 10–60s @70–100% max voluntary contraction, 60–180s rest. Focus on position maintenance, muscle tension without movement. Emphasize proper breathing and form.",
  //cardio: "Focus on heart rate elevation, minimal rest, circuit-style training. Include dynamic movements.",
  //hypertrophy: "Use 7-12 rep range, moderate rest (70-140s), focus on time under tension and muscle fatigue.",
  //isolation: "Single-joint movements, target specific muscles, higher reps (8-20), shorter rest periods.",
  //strength: "Heavy compound movements, 3-6 reps, longer rest (2-4 minutes), focus on progressive overload.",
  //speed: "Explosive movements, focus on velocity, include plyometrics if appropriate, full recovery between sets.",
  //stability: "Focus on balance, core engagement, and controlled movements. Include unilateral exercises, unstable surfaces when appropriate, and exercises that challenge proprioception. Use moderate reps (10-15) with controlled tempo.",
  //activation: "Light loads, focus on mind-muscle connection, prep movements, 15-20 reps, minimal rest.",
  //stretch: "Include dynamic and static stretches in correct order, hold positions, focus on flexibility and range of motion.",
  //mobility: "Joint-focused movements, full range of motion, controlled tempo, include mobility drills.",
  //plyometric: "Jumping, bounding, explosive movements for sprinters, maximum effort, full recovery between sets."
};

// Base workout generation prompt
export const BASE_WORKOUT_PROMPT = `
You are a fitness science expert. Design an optimal workout based on these parameters:

USER INPUTS:
- MUSCLE_FOCUS: {{muscleFocus}}
- WORKOUT_FOCUS: {{workoutFocus}}
- EXERCISE_COUNT: {{exerciseCount}}
{{#specialInstructions}}- SPECIAL: {{specialInstructions}}{{/specialInstructions}}

TRAINING PARAMETERS FOR {{workoutFocus}}:
{{focusSpecificInstructions}}

PROGRAMMING REQUIREMENTS:
1. EXACTLY {{exerciseCount}} exercises
2. Minimum {{minExercisesForMuscle}} exercises must target MUSCLE_FOCUS
3. Exercise sequence must follow scientific principles for {{workoutFocus}}
4. Avoid redundant movement patterns
5. Balance joint stress distribution
6. Include appropriate progressions/regressions
7. Match sets/reps/rest with {{workoutFocus}} principles
8. Appropriate technical difficulty
9. For single muscle focus: target different angles/functions
10. For cardio/plyometric/stretching: include varied modalities
11. Prioritize safety and efficiency
12. For rationale: explain how to perform the exercise and what to avoid (max 3 sentences)

OUTPUT FORMAT:
Return ONLY valid JSON (no text outside object):

{
  "workout": {
    "exercises": [
      {
        "name": "Exercise Name",
        "sets": 3,
        "reps": 10,
        "rest_time_seconds": 90,
        "rationale": "Form guidance, benefits, risks, and tips"
      }
    ],
    "total_duration_minutes": 30,
    "muscle_groups_targeted": "Primary muscle groups",
    "joint_groups_affected": "Primary joints used",
    "equipment_needed": "All equipment required"
  }
}
`;

// Retry prompt suffix with emphasis on JSON safety
export const RETRY_PROMPT_SUFFIX = `
IMPORTANT: Ensure STRICTLY valid JSON with the exact structure. No extra text.`;

// Retry template = same as BASE but append retry suffix
export const RETRY_WORKOUT_PROMPT = BASE_WORKOUT_PROMPT + RETRY_PROMPT_SUFFIX;
