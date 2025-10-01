"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

// This is a simple client-side authentication check
// In a real application, you would use a proper authentication system like NextAuth.js or Supabase Auth
export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  // Check authentication using Supabase session
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error || !session) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="content-card">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="content-card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">You need to be logged in to access this page.</p>
          <Link href="/auth/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If authenticated, show the protected content with navigation
  return (
    <div className="min-h-screen">
      {/* Protected area navigation */}
      <nav className="bg-black/80 backdrop-blur-sm text-white p-4 mb-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
          <div className="text-xl font-bold">FitGen</div>
          <div className="flex space-x-4">
            <Link href="/protected/workouts" className="hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/protected/workouts/generate" className="hover:text-gray-300">
              Generate Workout
            </Link>
            <Link href="/protected/profile" className="hover:text-gray-300">
              Profile
            </Link>
            <button 
              onClick={handleSignOut}
              className="hover:text-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4">
        {children}
      </div>
    </div>
  );
}
