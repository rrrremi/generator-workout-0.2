/**
 * Workout Focus Tooltip Content
 * 
 * This file contains multiple tooltip variations for each workout focus type.
 * One variation will be randomly selected when displaying the tooltip.
 */

export type TooltipContent = {
  variations: string[];
};

export type WorkoutFocusTooltips = {
  [key: string]: TooltipContent;
};

export const workoutFocusTooltips: WorkoutFocusTooltips = {
  hypertrophy: {
    variations: [
      "Optimizes muscle growth through moderate weights and higher volume. Focuses on time under tension and metabolic stress to stimulate maximum muscle fiber development.",
      "Targets muscle size increase through controlled tempo and moderate-to-high rep ranges. Creates cellular swelling and protein synthesis for optimal growth.",
      "Emphasizes muscle tissue expansion through strategic volume and intensity. Balances mechanical tension and metabolic fatigue to maximize growth stimulus."
    ]
  },
  strength: {
    variations: [
      "Develops maximum force production using heavier weights and lower reps. Focuses on neural adaptations and muscle fiber recruitment for raw power gains.",
      "Builds absolute strength through progressive overload and compound movements. Prioritizes central nervous system efficiency and motor unit synchronization.",
      "Enhances force production capacity through high-intensity, low-rep training. Emphasizes intermuscular coordination and neuromuscular efficiency."
    ]
  },
  cardio: {
    variations: [
      "Improves cardiovascular endurance and oxygen utilization efficiency. Enhances heart strength, lung capacity, and overall stamina for daily activities.",
      "Boosts aerobic capacity through sustained elevated heart rate training. Strengthens cardiac output and improves mitochondrial density for better energy production.",
      "Develops cardiovascular health through rhythmic, continuous movement. Enhances oxygen delivery systems and improves recovery between strength efforts."
    ]
  },
  isolation: {
    variations: [
      "Targets specific muscles with precise, single-joint movements. Addresses muscle imbalances and enhances mind-muscle connection for better development.",
      "Focuses on individual muscle groups with controlled, targeted exercises. Allows for specialized development and correction of weak points in physique.",
      "Concentrates on specific muscle activation through isolated movement patterns. Minimizes assistance from other muscle groups for pure, focused development."
    ]
  },
  stability: {
    variations: [
      "Enhances balance, coordination, and core strength through controlled movements. Improves proprioception and joint integrity for injury prevention.",
      "Develops the body's ability to maintain position during movement challenges. Strengthens stabilizer muscles often neglected in traditional training.",
      "Focuses on control and balance through challenging positions and movements. Builds functional strength that transfers to everyday activities and sports."
    ]
  },
  plyometric: {
    variations: [
      "Develops explosive power through rapid stretch-shortening cycles. Enhances reactive strength and athletic performance for sports and dynamic activities.",
      "Builds power output through explosive, high-velocity movements. Trains fast-twitch muscle fibers and improves rate of force development.",
      "Focuses on explosive strength and speed through jumping and reactive exercises. Enhances neuromuscular efficiency and athletic power transfer."
    ]
  },
  isometric: {
    variations: [
      "Builds strength through static muscle contractions without joint movement. Excellent for joint stability, rehabilitation, and breaking through strength plateaus.",
      "Develops tension and strength by holding positions against resistance. Improves mind-muscle connection and can be performed with minimal equipment.",
      "Focuses on static strength through sustained muscle contractions. Increases time under tension and can be particularly effective for core and postural muscles."
    ]
  },
  activation: {
    variations: [
      "Prepares specific muscles for more intense work through targeted, light movements. Enhances neural drive and muscle recruitment for better workout performance.",
      "Awakens and primes muscles through controlled, focused exercises. Improves mind-muscle connection and movement quality for subsequent training.",
      "Stimulates neural pathways to muscles before heavier training. Reduces injury risk and improves exercise technique through enhanced proprioception."
    ]
  },
  stretch: {
    variations: [
      "Improves flexibility and range of motion through controlled elongation of muscles. Enhances recovery and reduces injury risk during dynamic movements.",
      "Increases tissue elasticity and joint mobility through targeted stretching techniques. Improves posture and movement efficiency in daily activities.",
      "Focuses on lengthening muscles and improving tissue extensibility. Reduces muscle tension and can help alleviate movement restrictions."
    ]
  },
  mobility: {
    variations: [
      "Enhances functional range of motion at specific joints through controlled movement. Combines strength and flexibility for better movement quality.",
      "Develops the ability to move freely through full ranges of motion. Addresses both joint restrictions and muscle limitations for improved function.",
      "Focuses on active control throughout available movement ranges. Builds strength at end ranges and improves overall movement capacity."
    ]
  }
};

/**
 * Get a random tooltip variation for a specific workout focus
 * @param focusId The workout focus ID
 * @returns A random tooltip variation or undefined if focus ID doesn't exist
 */
export function getRandomTooltip(focusId: string): string | undefined {
  const tooltipContent = workoutFocusTooltips[focusId];
  
  if (!tooltipContent) {
    return undefined;
  }
  
  const randomIndex = Math.floor(Math.random() * tooltipContent.variations.length);
  return tooltipContent.variations[randomIndex];
}
