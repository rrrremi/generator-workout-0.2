"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function WorkoutHistory() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Mock data for demonstration purposes
    setTimeout(() => {
      setWorkouts([
        {
          id: 1,
          date: '2025-06-28',
          type: 'Full Body',
          duration: 45,
          completed: true
        },
        {
          id: 2,
          date: '2025-06-26',
          type: 'Upper Body',
          duration: 30,
          completed: true
        },
        {
          id: 3,
          date: '2025-06-24',
          type: 'Cardio',
          duration: 40,
          completed: true
        },
        {
          id: 4,
          date: '2025-06-22',
          type: 'Lower Body',
          duration: 35,
          completed: true
        },
        {
          id: 5,
          date: '2025-06-20',
          type: 'Core',
          duration: 25,
          completed: true
        },
        {
          id: 6,
          date: '2025-06-18',
          type: 'Full Body',
          duration: 50,
          completed: true
        },
        {
          id: 7,
          date: '2025-06-16',
          type: 'Upper Body',
          duration: 35,
          completed: true
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Workout History</h1>
        <Link href="/protected/workouts/generate">
          <Button>Generate New Workout</Button>
        </Link>
      </div>
      
      {loading ? (
        <div className="content-card text-center py-10">
          <p className="text-xl">Loading your workout history...</p>
        </div>
      ) : workouts.length > 0 ? (
        <div className="content-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Duration</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map(workout => (
                  <tr key={workout.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(workout.date)}</td>
                    <td className="py-3 px-4">{workout.type} Workout</td>
                    <td className="py-3 px-4">{workout.duration} min</td>
                    <td className="py-3 px-4">
                      {workout.completed ? (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="content-card text-center py-10">
          <p className="text-xl mb-4">No workout history found</p>
          <p className="mb-6">Start your fitness journey by generating your first workout</p>
          <Link href="/protected/workouts/generate">
            <Button>Generate Workout</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
