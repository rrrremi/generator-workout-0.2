"use client";

import { useState } from 'react';
import Button from '@/components/ui/Button';

const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
const focusAreaOptions = ['full body', 'upper body', 'lower body', 'core', 'cardio', 'strength'];
const equipmentOptions = ['none', 'basic', 'full gym'];

export default function GenerateWorkout() {
  const [formData, setFormData] = useState({
    fitnessLevel: 'intermediate',
    focusAreas: ['full body'],
    duration: 45,
    equipment: 'basic'
  });
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFocusAreaChange = (area) => {
    setFormData(prev => {
      const newFocusAreas = prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area];
      
      return {
        ...prev,
        focusAreas: newFocusAreas.length > 0 ? newFocusAreas : ['full body'] // Default to full body if nothing selected
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workouts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setWorkout(data);
    } catch (err) {
      console.error('Failed to generate workout:', err);
      setError('Failed to generate workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Generate Workout Plan</h1>
      
      <div className="content-card mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium mb-2">Fitness Level</label>
            <div className="flex flex-wrap gap-3">
              {fitnessLevels.map(level => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="fitnessLevel"
                    value={level}
                    checked={formData.fitnessLevel === level}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-lg font-medium mb-2">Focus Areas</label>
            <div className="flex flex-wrap gap-3">
              {focusAreaOptions.map(area => (
                <label key={area} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.focusAreas.includes(area)}
                    onChange={() => handleFocusAreaChange(area)}
                    className="mr-2"
                  />
                  <span className="capitalize">{area}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-lg font-medium mb-2">Workout Duration (minutes)</label>
            <input
              type="range"
              name="duration"
              min="15"
              max="90"
              step="5"
              value={formData.duration}
              onChange={handleChange}
              className="w-full"
            />
            <div className="flex justify-between text-sm">
              <span>15 min</span>
              <span>{formData.duration} min</span>
              <span>90 min</span>
            </div>
          </div>
          
          <div>
            <label className="block text-lg font-medium mb-2">Available Equipment</label>
            <div className="flex flex-wrap gap-3">
              {equipmentOptions.map(equipment => (
                <label key={equipment} className="flex items-center">
                  <input
                    type="radio"
                    name="equipment"
                    value={equipment}
                    checked={formData.equipment === equipment}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="capitalize">{equipment}</span>
                </label>
              ))}
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Workout'}
          </Button>
          
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </form>
      </div>
      
      {workout && (
        <div className="content-card">
          <h2 className="text-2xl font-bold mb-6">Your Personalized Workout</h2>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Warm-up ({workout.warmup.reduce((total, exercise) => total + parseInt(exercise.duration), 0)} minutes)</h3>
            <ul className="space-y-3">
              {workout.warmup.map((exercise, index) => (
                <li key={index} className="p-3 bg-white/50 rounded-md">
                  <div className="font-medium">{exercise.name} - {exercise.duration}</div>
                  <div className="text-sm text-gray-700">{exercise.description}</div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Main Workout</h3>
            <ul className="space-y-3">
              {workout.mainWorkout.map((exercise, index) => (
                <li key={index} className="p-3 bg-white/50 rounded-md">
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm">
                    <span className="inline-block bg-black text-white px-2 py-1 rounded-md mr-2">
                      {exercise.sets} sets
                    </span>
                    <span className="inline-block bg-black text-white px-2 py-1 rounded-md mr-2">
                      {exercise.reps} reps
                    </span>
                    <span className="inline-block bg-gray-200 px-2 py-1 rounded-md">
                      Rest: {exercise.rest}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{exercise.description}</div>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Cool Down ({workout.cooldown.reduce((total, exercise) => total + parseInt(exercise.duration), 0)} minutes)</h3>
            <ul className="space-y-3">
              {workout.cooldown.map((exercise, index) => (
                <li key={index} className="p-3 bg-white/50 rounded-md">
                  <div className="font-medium">{exercise.name} - {exercise.duration}</div>
                  <div className="text-sm text-gray-700">{exercise.description}</div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-8">
            <Button onClick={() => window.print()} variant="outline">
              Print Workout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
