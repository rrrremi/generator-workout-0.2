'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import ContentContainer from '@/components/layout/ContentContainer';
import { Dumbbell, Sparkles } from 'lucide-react';

export default function WorkoutDetailsPage() {
  return (
    <PageLayout>
      {/* Header with back navigation */}
      <PageHeader 
        backLink="/protected/workouts" 
        backText="Back to Workouts"
      >
        {/* Optional header actions can go here */}
      </PageHeader>
      
      {/* Main content area */}
      <ContentContainer>
        {/* Workout header section */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight flex items-center">
                <Dumbbell className="h-8 w-8 mr-3 text-fuchsia-400" />
                Workout Details
              </h1>
              <p className="mt-2 text-sm text-white/70">
                Review your personalized workout and get ready to crush it!
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/20 transition-colors flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate New
              </button>
            </div>
          </div>
        </section>
        
        {/* Workout content sections */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-medium">Workout Overview</h2>
          </div>
          <div className="p-6">
            <p>Your workout content goes here...</p>
          </div>
        </section>
      </ContentContainer>
    </PageLayout>
  );
}
