// Simple script to test the workout generation API
// Using built-in Fetch API

async function testWorkoutGeneration() {
  try {
    console.log('Testing workout generation API...');
    
    const response = await fetch('http://localhost:3003/api/workouts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        muscle_focus: ['chest', 'shoulders'],
        workout_focus: 'hypertrophy',
        exercise_count: 4,
        special_instructions: 'Include at least one bodyweight exercise'
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Workout generation successful!');
      console.log('Workout ID:', data.workoutId);
    } else {
      console.log('❌ Workout generation failed!');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testWorkoutGeneration();
